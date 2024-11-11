FROM alpine:latest AS archive
    RUN apk add --no-cache curl

    WORKDIR /app/ia
    # Get ia command line
    RUN curl -LO https://archive.org/download/ia-pex/ia \
        && chmod +x ia

FROM node:latest AS webui


FROM alpine:latest AS prod
    COPY --from=archive /app/ia /app/ia
    COPY --from=webui /app/webui /app/webui

    # if using python backend
    # RUN apk add --no-cache python3 py3-pip \
    #   && python3 -m ensurepip \
    #   && python3 -m pip install internetarchive


ENTRYPOINT [ "/bin/bash" ]