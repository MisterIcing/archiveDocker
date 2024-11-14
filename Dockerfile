FROM node:latest AS webui
    RUN apt update && apt install -y \
        wget \
        unzip 
        # python3 \
        # python3-flask \
        # python3-flask-cors \
        # python3-internetarchive

    # Build my webapp
    WORKDIR /tmp
    RUN mkdir /app && mkdir /app/webapp \
        && wget https://github.com/MisterIcing/internetArchiveWebgui/archive/refs/heads/main.zip \
        && unzip main.zip \
        && mv *-main/* /app/webapp/


    WORKDIR /app/webapp/webgui
    RUN npm i \
        && npm run build

FROM node:latest AS prod
    # RUN apk add --no-cache bash python3
    RUN apt update && apt install -y \
        python3-flask \
        python3-flask-cors \
        python3-internetarchive \
        python3-gunicorn
    RUN npm install -g serve
    RUN mkdir /log

    COPY --from=webui /app/webapp/backend /app/backend
    COPY --from=webui /app/webapp/webgui/build /app/frontend
    COPY --from=webui /app/webapp/entry /app/entryScript
    WORKDIR /app
    RUN chmod +x entryScript

EXPOSE 3000
EXPOSE 5000
ENTRYPOINT [ "/bin/bash" ]