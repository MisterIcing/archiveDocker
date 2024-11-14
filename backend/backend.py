from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from internetarchive import get_files, download
import os
import re
from celery import Celery

#https://archive.org/developers/internetarchive/api.html#searching-items


app = Flask(__name__)
# CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}})
CORS(app)

# set up celery for long downloads
app.config['CELERY_BROKER_URL'] = 'redis://localhost:6379/0'
app.config['CELERY_RESULT_BACKEND'] = 'redis://localhost:6379/0'
celery = Celery(app.name, broker=app.config['CELERY_BROKER_URL'])
celery.conf.update(app.config)

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
    return jsonify({'task_id': task.id}), 202

@celery.task(bind=True)
def longDownload(self, id, kwargs):
    download(id, **kwargs)
    return "Completed Download"

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

    # TODO Should change http code?
    if id:
        return jsonify(result=id), 200 
    else:
        jsonify(error=f'Invalid url. Results: {id}'), 406

# Helper function turning the url into the archive identifier (the thing after /details/)
#  	- Inputs:
#       - id: str('') to seperate to valid id
#   - Outputs:
#       - str: Valid archive id
#       - None: If no id was found or if uses invalid symbols
def url2ID(id: str=''):
    # remove base to get identifier
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
    
    # TODO Should throw error?
    return None

if __name__ == '__main__':
    app.run(port=5000)
