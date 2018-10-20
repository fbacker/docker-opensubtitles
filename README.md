# Docker OpenSubtitles

Need a docker container to handle downloading of opensubtitles, you got one.

Why need one? Often opensubtitles exists in clients. They help you finding a 'best match' of subs. However when not watching the video anymore or if you are using multiple clients, they don't share.

## How it works

Start the docker container with paths to movies and series. At first startup it will check all your files for matches. If you already have subs for the media it will be ignored.

It will connect to your OpenSubtitle account and use your custom settings for languages that you want.

### Why it's special

Not only it will place subs on your actual server so you don't need to re-find the best match every time. It also does some extra scoring. It matches results with key names, fps, size gathered from media streams and filepath. Adds these custom scoreing to OpenSubtitles own scoring system to find the best match.

## All in place, how to work with it

When a new media is added it will automatically try to find a match and place it in the same folder.

If you notice that the sub is not to your liking. Delete it from disk.

This will trigger a new download and a new sub will be placed.

### I had a good sub and accidentily delete it

In every base folder of Movie or Serie a .opensubtitle file is created. It stores unique id;s of downloaded subs.

When looking for new files these ids will be ignored.

By deleting this file you'll 'reset' the download que and 'best' result will be downloaded again.

## Docker

When running docker container you'll need to specify /movies and /series. You'll also need to provide a /config path with a `local.json` file where setting can be overridden.

Check config/default.json file for setting to override. At minimum you'll need to specify OpenSubtitle username and password

local.json

```json
{
  "opensubtitles": {
    "username": "xyx",
    "password": "123"
  }
}
```

docker-compose.yaml

```docker
opensubtitles:
    image: fredrickbacker/opensubtitles
    container_name: opensubtitles
    user: "${UID}:${GID}"
    volumes:
        - /path-to-local-movies:/movies
        - /path-to-local-series:/series
        - /path-to-temp-downloaded-subs:/tmp
        - /path-to-config:/config
```
