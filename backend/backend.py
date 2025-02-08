from flask import Flask, request, jsonify, make_response
from flask_socketio import SocketIO, emit
from flask_cors import CORS, cross_origin
from internetarchive import get_files, download
import os
import re
from celery import Celery

#https://archive.org/developers/internetarchive/api.html#searching-items

########################################################################################################
#Global vars
UI_UPDATE_TIME = 10         # seconds between sending task updates
REDIS_URL = 'redis://127.0.0.1:6379/0'
# REDIS_URL = 'redis://redis:6379/0' # compose url

########################################################################################################
#Set up

# set up flask
app = Flask(__name__)

# set up socketio for watching tasks
socketio = SocketIO(app, cors_allowed_origins="*", message_queue=REDIS_URL)

# set up cors
CORS(app, resources={r"/*": {"origins": "*"}})

# set up celery for long downloads
app.config['BROKER_URL'] = REDIS_URL
app.config['CELERY_RESULT_BACKEND'] = REDIS_URL
celery = Celery(app.name, broker=app.config['BROKER_URL'], backend=app.config['CELERY_RESULT_BACKEND'], task_ignore_result=False)
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
# 	- Output:  
# 		- 200: Newline joined string of all the files
# 		- 202: No URL/identifier
# 		- 204: Options confirmation
# 		- 406: Invalid identifier
@app.route('/api/list', methods=['POST'])
@cross_origin()
def list():
    # preflight
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = make_response('', 200)
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        return response

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

    fileNames = [f.name for f in get_files(id, **kwargs)]
    result = '\n'.join(fileNames)

    return jsonify(result=result), 200

# POST `/api/download`
# 	- Begins download from internet archive to storage (`backend/output`)
# 	- Inputs:
# 		- `url`: archive identifier or url with identifier
# 	- Optional Inputs:
# 		- `glob`: glob pattern
# 		- `verbose`: boolean
# 	- Output: None
@app.route('/api/download', methods=['OPTIONS', 'POST'])
@cross_origin()
def run():
    # preflight
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = make_response('', 200)
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        return response
    
    data = request.json

    if not data.get('url'):
        return jsonify(error="URL/Identifier is required"), 202
    id = url2ID(data['url'])
    if not id:
        return jsonify(error="Identifier could not be resolved"), 406

    # extra args (glob, verbose, destdir)
    kwargs = {}
    if data.get('glob'):
        kwargs['glob_pattern'] = data['glob']
    kwargs['verbose'] = data.get('verbose', True)
    kwargs['destdir'] = 'output'

    # create output folder if it doesnt exist
    os.makedirs('output', exist_ok=True)

    task = longDownload.delay(id, kwargs)

    return jsonify({'task_id': task.id}), 200

# POST `/api/url2ID`
# 	- Limits URL to identifier for internet archive
# 	- Inputs:
# 		- `url`: archive identifier or url with identifier
# 	- Output:
# 		- 200: Found identifier
# 		- 202: No URL/identifier
# 		- 204: Options confirmation
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
        return jsonify(error=f'Invalid url. Results: {id}'), 406

########################################################################################################
#Celery helpers

# Background task to actually download the files from archive
# Gunicorn has a timeout, so its outsourced to celery
# Completion is emitted by socketio to the client
#   - Inputs:
#       - id: archive identifier
#       - kwargs: 
#           - glob_pattern
#           - exlude_pattern
#           - destdir
#           - verbose
#   - Outputs:
#       - return: 
#           - 'Completed Download'
#       - socketio:
#           - task_status complete
@celery.task(bind=True)
def longDownload(self, id, kwargs):
    taskId = self.request.id
    try:
        socketio.emit('tUpdate', {'taskId': taskId, 'status': 'STARTED'})

        download(id, **kwargs)
        changeOwner(id)

        socketio.emit('tUpdate', {'taskId': taskId, 'status': 'FINISHED'})
        return True
    except Exception as eva:
        socketio.emit('tUpdate', {'taskId': taskId, 'status': 'FAILED'})
        return False
    

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
        # http[s]?://archive.org/details/<id>/<file>
        # https?://archive.org/download/<id>/<file>
    # find & remove url base
    res = re.match(r"https?:\/\/archive.org\/(?:details|download)\/([^/\n]+).*", id)
    if res:
        if re.match(r"^[A-z0-9-.,]+$",res.group(1)):
            return res.group(1)
        return None
    # limit identifier to only valid symbols. no $ / # ... you get the gist
        # only allows alphanum . , -
    res = re.match(r"^[A-z0-9-.,]+$", id)
    if res:
        return id
    return None

# Ownership changing
# Unraid needs the owner to be `nobody users` (99) (100) in order for transfering to work properly
# Uses mask 022
# Also updates permissions as
#   For directories:
#   drwxrwxrwx
# For read/write files:
#   -rw-rw-rw-
# For readonly files:
#   -r--r--r--
# https://www.reddit.com/r/unRAID/comments/xup40x/comment/iqxpyld/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button
#
#   - Inputs:
#       - id: str of folder, which is the archive identifier
def changeOwner(id: str, uid: int=99, gid: int=100, dPerm: int=0o777, fPerm: int= 0o666):
    oMask = os.umask(0o022)
    for root, dirs, files in os.walk(f'output/{id}'):
        os.chown(root, uid, gid)
        for d in dirs:
            path = os.path.join(root, d)
            # os.chmod(path, dPerm)
            os.chown(path, uid, gid)
        for f in files:
            path = os.path.join(root, f)
            os.chmod(path, fPerm)
            os.chown(path, uid, gid)
    os.umask(oMask)

########################################################################################################
#Start app

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)