const path = require('path');
const _ = require('lodash');
const watch = require('node-watch');
const globals = require('./globals');
const login = require('./opensubtitle/login');
const listDirectory = require('./files/listDirectory');
const isDirectory = require('./files/isDirectory');
const findAll = require('./files/findAll');
const getAndExtractFiles = require('./files/getAndExtractFiles');
const findMediaReferenceFiles = require('./files/findMediaReferenceFiles');
const subsExists = require('./opensubtitle/subsExists');
const readMetadata = require('./files/readMetadata');
const lookupIMDB = require('./files/lookupIMDB');
const search = require('./opensubtitle/search');
const match = require('./opensubtitle/match');
const download = require('./opensubtitle/download');
const getBlockedFiles = require('./opensubtitle/getBlockedFiles');
const cleanBlockedFiles = require('./opensubtitle/clean');
const isFile = require('./files/isFile');
const watchInteresting = require('./files/watchInteresting');
const createId = require('./files/createId');

const types = Object.freeze({ series: 'series', movies: 'movies' });
let queMovies = [];
let queSeries = [];
const queItems = [];
const { config, logger } = globals;
let queLookupIsRunning = false;
let queIsRunning = false;
/**
 * Load variables to use
 */

const queParse = () => {
  logger.log({
    level: 'debug',
    label: 'QueParse',
    message: `Run que, has ${queParse.length} in list`,
    meta: {
      queIsRunning,
      queLookupIsRunning,
      numOfMovies: queMovies.length,
      numOfSeries: queSeries.length,
    },
  });
  if (queIsRunning || queMovies.length > 0 || queSeries.length > 0) return;
  queIsRunning = true;

  if (!globals.userToken) {
    logger.log({
      level: 'error',
      label: 'QueParse',
      message: 'Not logged in to openhab.',
    });
    // @TODO need to re login
    queIsRunning = false;
    return;
  }

  // We got an item, lets do something
  if (queItems.length > 0) {
    const item = queItems.shift();
    logger.log({
      level: 'info',
      label: 'QueParse',
      message: `Working Item ${queItems.length} in que`,
      meta: item,
    });

    findMediaReferenceFiles(item)
      .then(subsExists)
      .then(readMetadata)
      .then(lookupIMDB)
      .then(search)
      .then(getBlockedFiles)
      .then(cleanBlockedFiles)
      .then(match)
      .then(download)
      .then(() => {
        logger.log({
          level: 'debug',
          label: 'QueParse',
          message: 'Is completed',
        });
        queIsRunning = false;
      })
      .catch((e) => {
        logger.log({
          level: 'error',
          label: 'QueParse',
          message: 'Failed to handle item',
          meta: { message: e.message, stack: e.stack.toString() },
        });
        if (e.message === 'Too many requests') {
          logger.log({
            level: 'error',
            label: 'QueParse',
            message: 'Too many request to the api',
          });
        }
        queIsRunning = false;
      });
  } else {
    logger.log({
      level: 'debug',
      label: 'QueParse',
      message: 'Que is empty',
    });
    queIsRunning = false;
  }
};

const queLookup = () => {
  if (queLookupIsRunning) return;
  queLookupIsRunning = true;

  // Lets find movie stuff
  if (queMovies.length > 0) {
    logger.log({
      level: 'info',
      label: 'QueLookup',
      message: `Found ${queMovies.length} movies and ${queSeries.length} in que. Run Movie.`,
      meta: { movies: queMovies.length, series: queSeries.length },
    });

    const folderName = queMovies.shift();
    const fullPath = path.join(config.settings.paths.movies, folderName);
    const settings = { folderName, fullPath, type: types.movies };
    isDirectory(Object.assign({}, settings))
      .then(createId)
      .then(findAll)
      .then(getAndExtractFiles)
      .then((obj) => {
        _.each(obj.medias, (media) => {
          const qItem = Object.assign({}, settings, obj, {
            media,
          });
          delete qItem.medias;
          queItems.push(qItem);
        });
        queLookupIsRunning = false;
      })
      .catch((e) => {
        logger.log({
          level: 'error',
          label: 'QueLookup',
          message: 'Failed to load series',
          meta: { e, fullPath },
        });
        queLookupIsRunning = false;
      });
  } else if (queSeries.length > 0) {
    // Lets find Series stuff
    logger.log({
      level: 'info',
      label: 'QueLookup',
      message: `Found ${queMovies.length} movies and ${queSeries.length} in que.  Run Series`,
      meta: { movies: queMovies.length, series: queSeries.length },
    });

    const folderName = queSeries.shift();
    const fullPath = path.join(config.settings.paths.series, folderName);
    const settings = { folderName, fullPath, type: types.series };
    isDirectory(Object.assign({}, settings))
      .then(createId)
      .then(findAll)
      .then(getAndExtractFiles)
      .then((obj) => {
        _.each(obj.medias, (media) => {
          const qItem = Object.assign({}, settings, obj, {
            media,
          });
          delete qItem.medias;
          queItems.push(qItem);
        });
        queLookupIsRunning = false;
      })
      .catch((e) => {
        logger.log({
          level: 'error',
          label: 'QueLookup',
          message: 'Failed to load series',
          meta: e,
        });
        queLookupIsRunning = false;
      });
  } else {
    queLookupIsRunning = false;
  }
};

// a watch file is changed, do we want to add it to check pile?
const watchFolder = (mediaFolder, name, type, event) => new Promise((resolve, reject) => {
  isFile({ fullPath: name, type, event })
    .then(watchInteresting)
    .then(() => {
      const base = name.substring(mediaFolder.length + 1);
      const folders = base.split('/');
      if (folders.length >= 1) {
        resolve(folders[0]);
      }
    })
    .catch(() => {
      reject();
    });
});

const setup = () => {
  logger.log({
    level: 'debug',
    label: 'setup',
    message: 'Setup watch and list all directories',
  });
  watch(config.settings.paths.series, { recursive: true }, (evt, name) => {
    logger.log({
      level: 'debug',
      label: 'watch',
      message: 'File changed in series',
      meta: { evt, name },
    });
    watchFolder(config.settings.paths.series, name, types.series, evt)
      .then((f) => {
        queSeries.push(f);
      })
      .catch(() => {
        // do nothing
      });
  });
  watch(config.settings.paths.movies, { recursive: true }, (evt, name) => {
    logger.log({
      level: 'debug',
      label: 'watch',
      message: 'File changed in movies',
      meta: { evt, name },
    });
    watchFolder(config.settings.paths.movies, name, types.movies, evt)
      .then((f) => {
        queMovies.push(f);
      })
      .catch(() => {
        // do nothing
      });
  });

  listDirectory(config.settings.paths.movies).then((files) => {
    queMovies = queMovies.concat(files);
  });
  listDirectory(config.settings.paths.series).then((files) => {
    queSeries = queSeries.concat(files);
  });
};

module.exports = () => {
  login()
    .then(() => {
      logger.log({
        level: 'info',
        label: 'opensubs',
        message: 'Connected',
      });
      setup();
      setInterval(queLookup, 500);
      setInterval(queParse, 15000);
    })
    .catch((err) => {
      process.exit(`Failed to login ${err}`);
    });
};
