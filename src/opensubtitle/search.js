const path = require('path');
const _ = require('lodash');
const globals = require('../globals');

const { logger, openSubtitles, config } = globals;

// Using OpenSubtitles API, grab all results
module.exports = _data => new Promise((resolve, reject) => {
  const data = Object.assign({}, _data);
  logger.log({
    level: 'info',
    label: 'ApiLookupMovies',
    message: 'Search API for a match',
  });
  const lang = globals.languages;
  const searchParams = {
    sublanguageid: lang.join(','),
    path: data.media,
    filename: path.basename(data.media),
    extensions: _.map(config.settings.fileTypes.subtitles, type => type.substring(1)),
    limit: 'all',
    gzip: false,
  };

  if (data.imdb) searchParams.imdbid = data.imdb.toString();
  if (data.fps) searchParams.fps = data.fps.toString();
  if (data.season) searchParams.season = data.season.toString();
  if (data.episode) searchParams.episode = data.episode.toString();

  logger.log({
    level: 'debug',
    label: 'ApiLookupMovies',
    message: 'Search Object',
    meta: searchParams,
  });
  openSubtitles
    .search(searchParams)
    .then((subtitles) => {
      // an array of objects, no duplicates (ordered by
      // matching + uploader, with total downloads as fallback)
      // console.log("respone", subtitles);
      if (Object.keys(subtitles).length === 0) {
        logger.log({
          level: 'error',
          label: 'ApiLookupMovies',
          message: `No results for ${searchParams.path}`,
        });
        reject(new Error(`No matches for ${data.media}`));
      } else {
        logger.log({
          level: 'debug',
          label: 'ApiLookupMovies',
          message: 'Successfully grabbed subtitles',
        });
        data.api = subtitles;
        resolve(data);
      }
    })
    .catch((err) => {
      logger.log({
        level: 'error',
        label: 'ApiLookupMovies',
        message: 'API Failed',
        meta: { err, body: err.body },
      });
      // @TODO check body, if too many requrest, delay next call.
      if (err.body.indexOf('429 Too Many Requests') > 0) {
        return reject(new Error('Too many requests'));
      }
      reject(new Error(`Search API Failed ${err}`));
      // @TODO if we got logged out, can we re-login?
    });
});
