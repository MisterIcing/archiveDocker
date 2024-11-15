from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from internetarchive import get_files, download
import os
import re
import time
from celery import Celery
from celery.result import AsyncResult
from threading import Thread

#https://archive.org/developers/internetarchive/api.html#searching-items

########################################################################################################
#Global vars
UI_UPDATE_TIME = 10      # seconds between sending task updates
POLLING_ENABLED = True  # disable constant polling if not downloading

########################################################################################################
#Set up

# set up flask
app = Flask(__name__)

# set up socketio
socketio = SocketIO(app, cors_allowed_origins="*", message_queue='redis://localhost:6379/0')

# set up cors
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})
# CORS(app)

# set up celery for long downloads
app.config['CELERY_BROKER_URL'] = 'redis://localhost:6379/0'
app.config['CELERY_RESULT_BACKEND'] = 'redis://localhost:6379/0'
celery = Celery(app.name, broker=app.config['CELERY_BROKER_URL'], backend=app.config['CELERY_RESULT_BACKEND'], task_ignore_result=False)
celery.conf.update(app.config)

########################################################################################################
#API Calls

# POST `/api/list`
# 	- Gets the list of files on the archive
# 	- Inputs: 
# 		- `url`: archive identifier or url with identifier
# 	- Optional Inputs: 
# 		- `glob`: glob pattern
# 		- `exclude`: glob pattern
# 	- Output: newline joined string of all the files
@app.route('/api/list', methods=['OPTIONS', 'POST'])
def list():
    # preflight
    if request.method == 'OPTIONS':
        return '', 204

    data = request.json

    # Give proper error if testing with http
    if not data.get('url'):
        return jsonify(error="URL/Identifier is required"), 202
    id = url2ID(data['url'])
    if not id:
        return jsonify(error="Identifier could not be resolved"), 406

    # extra args (glob/exclude)
    kwargs = {}
    if data.get('glob'):
        kwargs['glob_pattern'] = data['glob']
    if data.get('exclude'):
        kwargs['exclude_pattern'] = data['exclude']

    fileNames = [f.name for f in get_files(id, **kwargs)]
    result = '\n'.join(fileNames)

    return jsonify(result=result), 200

# POST `/api/download`
# 	- Begins download from internet archive to storage (`backend/output`)
# 	- Inputs:
# 		- `url`: archive identifier or url with identifier
# 	- Optional Inputs:
# 		- `glob`: glob pattern
# 		- `exclude`: glob pattern
# 		- `verbose`: boolean
# 	- Output: None
@app.route('/api/download', methods=['OPTIONS', 'POST'])
def run():
    # preflight
    if request.method == 'OPTIONS':
        return '', 204
    
    data = request.json

    if not data.get('url'):
        return jsonify(error="URL/Identifier is required"), 202
    id = url2ID(data['url'])
    if not id:
        return jsonify(error="Identifier could not be resolved"), 406

    # extra args (glob/exclude)
    kwargs = {}
    if data.get('glob'):
        kwargs['glob_pattern'] = data['glob']
    if data.get('exclude'):
        kwargs['exclude_pattern'] = data['exclude']
    kwargs['verbose'] = data.get('verbose', True)
    kwargs['destdir'] = 'output'

    # create output folder if it doesnt exist
    os.makedirs('output', exist_ok=True)

    task = longDownload.delay(id, kwargs)

    # return jsonify(result=result), 200
    Thread(target=updateStatus, args=(task.id,)).start()

    return jsonify({'task_id': task.id}), 202

# TODO these comments
@app.route('/api/task_status/<task_id>', methods=['GET'])
def task_status(task_id):
    task = longDownload.AsyncResult(task_id)
    if task.state == 'PENDING':
        response = {'status': 'Pending...'}
    elif task.state == 'SUCCESS':
        response = {'status': 'Completed', 'result': task.result}
    else:
        response = {'status': task.state, 'info': str(task.info)}
    return jsonify(response)

# POST `/api/url2ID`
# 	- Limits URL to identifier for internet archive
# 	- Inputs:
# 		- `url`: archive identifier or url with identifier
# 	- Output:
# 		- 200: Found identifier
# 		- 202: No URL/identifier
# 		- 406: Invalid identifier
@app.route('/api/url2ID', methods=['OPTIONS', 'POST'])
def url2ID_apiWrap():
    # preflight
    if request.method == 'OPTIONS':
        return '', 204

    data = request.json

    if not data.get('url'):
        return jsonify(error="URL/Identifier is required"), 202

    id = url2ID(data['url'])

    if id:
        return jsonify(result=id), 200 
    else:
        jsonify(error=f'Invalid url. Results: {id}'), 406

# TODO this entire function
# @app.route('/api/checkFiles', methods=['POST'])
# def checkFiles():
#     data = request.json

#     if not data.get('url'):
#         return jsonify(error="URL/Identifier is required"), 202
#     id = url2ID(data['url']) # Should sanitize from going back dirs
#     if not id:
#         return jsonify(error="Identifier could not be resolved"), 406

#     if not os.path.exists():
#         os.makedirs()

# TODO startPolling javadoc
@app.route('/api/startPolling', methods=['GET'])
def startPolling():
    global POLLING_ENABLED
    POLLING_ENABLED = True
    return jsonify({'status': 'Started'}), 200

# TODO stopPolling javadoc
@app.route('/api/stopPolling', methods=['GET'])
def stopPolling():
    global POLLING_ENABLED
    POLLING_ENABLED = False
    return jsonify({'status': 'Stopped'}), 200

########################################################################################################
#Celery helpers

# TODO longDownload javadoc
@celery.task(bind=True)
def longDownload(self, id, kwargs):
    result = download(id, **kwargs)

    socketio.emit('task_status', {'status': 'Completed', 'result': result})
    return "Completed Download"

########################################################################################################
#Helper functions

# Turns the url into the archive identifier (the thing after /details/)
#  	- Inputs:
#       - id: str('') to seperate to valid id
#   - Outputs:
#       - str: Valid archive id
#       - None: If no id was found or if uses invalid symbols
def url2ID(id: str=''):
    # known addresses:
        # http[s]?://archive.org/details/
    # find & remove url base
    while re.search("http[s]?://archive.org/details/", id):
        id = re.sub("http[s]?://archive.org/details/", "", id)
    # find & remove any subdirectories
    id = re.split(r'\/.*', id)[0]
    # limit identifier to only valid symbols. no $ / # ... you get the gist
        # only allows alphanum . , -
    if re.search(r"^[A-z0-9-.,]+$", id):
        return id
    
    return None

# Emitter status updater
#   - Inputs: 
#       - task_id: task id corresponding to async download
#   - Outputs:
#       - Socket emit w/task id and status
#   - Statuses:
#       - Pending: waiting to start
#       - In Progress: currently running; includes task info as `progress`
#       - Completed: finished task
#       - Unknown: catchall; includes task state as `progress`
def updateStatus(task_id):
    while POLLING_ENABLED:
        task = AsyncResult(task_id)
        if task.state == 'PENDING':
            socketio.emit('task_status', {'task_id': task_id, 'status': 'Pending' })
        elif task.state == 'PROGRESS':
            socketio.emit('task_status', {'task_id': task_id, 'status': 'In Progress', 'progress': task.info})
        elif task.state == "SUCCESS":
            socketio.emit('task_status', {'task_id': task_id, 'status': 'Completed'})
            break
        else:
            socketio.emit('task_status', {'task_id': task_id, 'status': 'Unknown', 'progress': task.state})
        time.sleep(UI_UPDATE_TIME)

########################################################################################################
#Start app

if __name__ == '__main__':
    # app.run(port=5000)
    socketio.run(app)
