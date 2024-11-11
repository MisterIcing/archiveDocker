# Introduction
Originally this started as a way to get files from the [internet archive](https://archive.org/) to my [unraid](https://unraid.net/) server, but there was no docker image in the community plugins that I found. Thus I needed to create the dockerfile so that I could add it to the server. Although the console is fine for me, its not for everyone that would use it, so I needed to make a web interface for them. I figured I could also do the same for youtube-dl and save time, so it is there too.

# Dockerfile
TODO once site works

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
	- Use `python3 backend.py` from the webgui folder

## API
- POST `/api/dryrun`
	- Gets the list of files in the archive folder
	- Inputs: `url`
	- Optional Inputs: 
		- `glob`: glob/widlcard pattern
		- `exclude`: glob/widlcard pattern
	- Output: newline joined string of all the files