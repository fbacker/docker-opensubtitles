# Docker OpenSubtitles

Need a docker container to handle downloading of opensubtitles, you got one.

Why need one? Often opensubtitles exists in clients. They help you finding a 'best match' of subs. However when not watching the video anymore or if you are using multiple clients, they don't share.

This will place the OpenSubtitles files on the actual file server automatically. Not happy with the match? Delete the file and a new file will be found.

## How it works

Start the docker container with paths to movies and series. At first startup it will check all your files for matches. If you already have subs for the media it will be ignored.

It will connect to your OpenSubtitle account and use your custom settings from the web for languages that you want. You can also specify the languages you want in the config file.

By default it uses `https://api.opensubtitles.org:443/xml-rpc` but can be overriden in config

```{
  "opensubtitles": {
    "endpoint": "custom endpoint"
```

### Why it's special

Not only it will place subs on your actual server so you don't need to re-find the best match every time. It also does some extra scoring. It matches results with keys from names, extracts fps and video size from media streams. Adds these custom score points on top of OpenSubtitles own scoring system to find the best match.

## All in place, how to work with it

At startup it will look thru all media for missing files. Due not to 'overload' the API it has a long cooldown.

When a new media is added it will automatically try to find a match and place the subtitle files in the same folder.

If you notice that the sub is not to your liking. Delete it from disk.

This will trigger a new download and a new subtitle will be found.

### I had a good sub and accidentily delete it

In every base folder of Movie or Serie a .opensubtitle file is created. It stores unique id;s of downloaded subtitles.

When looking for new files these ids will be ignored (has already been downloaded once).

By deleting this file you'll 'reset' the download que and 'best effort' subtitle will be downloaded again.

## Docker

When running docker container you'll need to specify /movies and /series. You'll also need to provide a /config path with a `local.json` file where setting can be overridden. If the configuration file has the path 'null' for either movies/series we won't look for subtitles.

Check config/default.json file for setting to override. At minimum you'll need to specify OpenSubtitle username and password. These can also be set from environment variables.

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
    environment:
      - USERNAME='my opensubtitle username'
      - PASSWORD='my opensubtitle password
```

Docker run

```docker
docker run \
  --env USERNAME='my opensubtitle username' \
  --env PASSWORD='my opensubtitle password' \
  --volume /path-to-local-movies:/movies \
  --volume /path-to-local-series:/series \
  --user "${UID}:${GID}" \
  --name opensubs \
  fredrickbacker/opensubtitles
```
