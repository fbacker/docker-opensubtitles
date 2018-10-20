
FROM alpine:3.8

RUN apk --update add \
    nodejs \ 
    npm \ 
    ffmpeg \ 
    bash

ADD . /app
WORKDIR /app

# where to check
VOLUME [ "/movies", "/series", "/tmp", "/config" ]

RUN npm install

ENTRYPOINT [ "node", "index.js" ]