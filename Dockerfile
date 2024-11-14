FROM node:latest AS webui
    RUN apt update && apt install -y \
        wget \
        unzip 

    # Get my webapp
    WORKDIR /tmp
    RUN mkdir /app && mkdir /app/webapp \
        && wget https://github.com/MisterIcing/internetArchiveWebgui/archive/refs/heads/main.zip \
        && unzip main.zip \
        && mv *-main/* /app/webapp/

    # Build webapp for deployment
    WORKDIR /app/webapp/webgui
    RUN npm i \
        && npm run build

FROM node:latest AS prod
    RUN apt update && apt install -y \
        python3-flask \
        python3-flask-cors \
        python3-internetarchive \
        gunicorn
    RUN npm install -g serve

    COPY --from=webui /app/webapp/backend/backend.py /app/backend.py
    COPY --from=webui /app/webapp/webgui/build /app/frontend
    # COPY --from=webui /app/webapp/webgui /app/frontend
    COPY --from=webui /app/webapp/entry /app/entryScript

    # Get ready for entry & logging
    WORKDIR /app
    RUN chmod +x entryScript

    # Secondary entry for dev
    RUN echo "#!/bin/bash" > secondEntry \
        && echo "serve -s frontend -l 3000 >> /log/webLog 2>&1 &" >> secondEntry \
        && echo "python3 backend.py 2>&1 | tee -a /log/serverLog &" >> secondEntry \
        && echo "wait" >> secondEntry \
        && chmod +x secondEntry

    RUN mkdir /log
    RUN mkdir output

EXPOSE 3000
EXPOSE 5000
ENTRYPOINT [ "/bin/bash" ]