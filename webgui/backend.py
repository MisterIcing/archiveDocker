from flask import Flask, request, jsonify
from flask_cors import CORS
from internetarchive import get_files

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

@app.route('/api/dryrun', methods=['POST'])
def run_function():
    data = request.json

    # extra args (glob/exclude)
    kwargs = {}
    if data.get('glob'):
        kwargs['glob_pattern'] = data['glob']
    if data.get('exclude'):
        kwargs['exclude_pattern'] = data['exclude']

    fileNames = [f.name for f in get_files(data['url'], **kwargs)]
    result = f"{"\n".join(fileNames)}"

    return jsonify(result=result)

if __name__ == '__main__':
    app.run(port=5000)
