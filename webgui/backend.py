from flask import Flask, request, jsonify
from flask_cors import CORS
from internetarchive import get_files

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

@app.route('/api/dryrun', methods=['POST'])
def run_function():
    data = request.json
    result = getDryRun(data)
    return jsonify(result=result)

def getDryRun(search):
    fileNames = [f.name for f in get_files(search['url'], glob_pattern=search['glob'], exclude_pattern=search['exclude'])]

    return f"{"\n".join(fileNames)}"

if __name__ == '__main__':
    app.run(port=5000)
