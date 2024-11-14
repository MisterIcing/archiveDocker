# Introduction
Originally this started as a way to get files from the [internet archive](https://archive.org/) to my [unraid](https://unraid.net/) server, but there was no docker image in the community plugins that I found. Thus I needed to create the dockerfile so that I could add it to the server. Although the console is fine for me, its not for everyone that would use it, so I needed to make a web interface for them. I figured I could also do the same for youtube-dl and save time, so it is there too.

# Dockerfile
- Ports
	- `3000`: webgui
	- `5000`: server
- Volumes
	- `/app/output`: Folder of downloaded files

By default, the console logs are linked to the server. There are also log files in `/log` for the subcomponents

# React Site
## Building
1) Frontend:
	- This is built on [node 18.20.4 (Hydrogen)](https://github.com/nvm-sh/nvm)
	- Use `npm i` in the webgui folder to install modules
	- Most of the color scheme is controlled in `global.module.css` if you need to change anything
1) Backend:
	- Built in python-3 with flask
	- Uses [internet archive python interface](https://github.com/jjjake/internetarchive)

## Running
- Ports:
	- `3000`: frontend port
	- `5000`: flask server port
- Frontend:
	- Use `npm start` or `npm run build` from the webgui folder
	- Note: URL for archive is the area following details
		- `https://archive.org/details/<THIS PART>`
- Backend:
	- Use `python3 backend.py` from the backend folder
	- Note: Outputs files to `backend/output`

## API
- POST `/api/list`
	- Gets the list of files on the archive
	- Inputs: 
		- `url`: archive identifier or url with identifier
	- Optional Inputs: 
		- `glob`: glob pattern
		- `exclude`: glob pattern
	- Output:  
		- 200: Newline joined string of all the files
		- 202: No URL/identifier
		- 406: Invalid identifier

- POST `/api/download`
	- Begins download from internet archive to storage (`backend/output`)
	- Inputs:
		- `url`: archive identifier or url with identifier
	- Optional Inputs:
		- `glob`: glob pattern
		- `exclude`: glob pattern
		- `verbose`: boolean
	- Output: 
		- 200: "Completed Download"
		- 202: No URL/identifier
		- 406: Invalid identifier

- POST `/api/url2ID`
	- Limits URL to identifier for internet archive
	- Inputs:
		- `url`: archive identifier or url with identifier
	- Output:
		- 200: Found identifier
		- 202: No URL/identifier
		- 406: Invalid identifier