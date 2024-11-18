FROM node:latest AS webui
    RUN apt update && apt install -y \
        git \
        unzip 

    # Get my webapp
    WORKDIR /
    # RUN mkdir /app && mkdir /app/webapp \
    #     && git clone https://github.com/MisterIcing/internetArchiveWebgui --branch main --single-branch /app/webapp
    COPY . /app

    # Build webapp for deployment
    WORKDIR /app
    RUN npm i \
        && npm run build

FROM node:latest AS prod
    RUN npm install -g serve

    COPY --from=webui /app/build /app

    WORKDIR /app

EXPOSE 3000
CMD ["serve", "-s", ".", "-l", "3000"]
# ENTRYPOINT [ "/bin/bash" ]