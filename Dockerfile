FROM node:latest AS webui
    RUN apt update && apt install -y \
        git \
        unzip 

    # Get my webapp
    WORKDIR /tmp
    RUN mkdir /app && mkdir /app/webapp \
        && git clone https://github.com/MisterIcing/internetArchiveWebgui --branch Celery --single-branch /app/webapp

    # Build webapp for deployment
    WORKDIR /app/webapp/webgui
    RUN npm i \
        && npm run build

FROM node:latest AS prod
    RUN apt update && apt install -y \
        python3-flask \
        python3-flask-cors \
        python3-internetarchive \
        python3-celery \
        python3-redis \
        gunicorn \
        celery \
        redis-server
    RUN npm install -g serve

    COPY --from=webui /app/webapp/backend/backend.py /app/backend.py
    COPY --from=webui /app/webapp/webgui/build /app/frontend
    COPY --from=webui /app/webapp/entry /app/entryScript

    # Get ready for entry & logging
    WORKDIR /app
    RUN chmod +x entryScript

    RUN mkdir /log
    RUN mkdir output

EXPOSE 3000
EXPOSE 5000
VOLUME [ "/app/output" ]
ENTRYPOINT [ "/app/entryScript" ]
# ENTRYPOINT [ "/bin/bash" ]