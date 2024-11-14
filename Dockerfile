FROM alpine:latest AS archive
    RUN apk add --no-cache curl

    WORKDIR /app/ia
    # Get ia command line
    RUN curl -LO https://archive.org/download/ia-pex/ia \
        && chmod +x ia

FROM node:latest AS webui
    RUN apt update && apt install -y \
        wget \
        unzip \
        python3 \
        python3-flask

    # Build my webapp
    WORKDIR /tmp
    RUN mkdir /app && mkdir /app/webapp \
        && wget https://github.com/MisterIcing/internetArchiveWebgui/archive/refs/heads/main.zip \
        && unzip main.zip \
        && mv *-main/* /app/webapp/


    WORKDIR /app/webapp/
    RUN cd webgui \
        && npm i

    # RUN 


# FROM alpine:latest AS prod
#     COPY --from=archive /app/ia /app/ia
#     COPY --from=webui /app/webui /app/webui

    # if using python backend
    # RUN apk add --no-cache python3 py3-pip \
    #   && python3 -m ensurepip \
    #   && python3 -m pip install internetarchive

EXPOSE 3000
EXPOSE 5000
ENTRYPOINT [ "/bin/bash" ]