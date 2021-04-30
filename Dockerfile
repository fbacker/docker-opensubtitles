
FROM alpine:3.13

RUN apk --update add \
    nodejs \ 
    npm \ 
    ffmpeg \ 
    bash

ADD . /app
WORKDIR /app

ENV NODE_ENV=production

# where to check
VOLUME [ "/movies", "/series", "/tmp", "/config" ]

RUN npm install --only=production

ENTRYPOINT [ "node", "index.js" ]