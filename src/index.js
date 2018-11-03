// const fs = require('fs');
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

const types = Object.freeze({ series: 'series', movies: 'movies' });
let queMovies = [];
let queSeries = [];
const queItems = [];
let queInterval;
const { config, logger } = globals;

/**
 * Load variables to use
 */
let queParse;
const queStart = (delay = 15000) => {
  queInterval = setInterval(queParse, delay);
};
const queStop = () => {
  clearInterval(queInterval);
};
queParse = () => {
  if (!globals.userToken) return;

  // We got an item, lets do something
  if (queItems.length > 0) {
    queStop();
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
          label: 'parse item',
          message: 'Is completed',
        });
        queStart();
      })
      .catch((e) => {
        logger.log({
          level: 'error',
          label: 'parse item',
          message: 'Failed to handle item',
          meta: e,
        });
        queStart();
      });
    return;
  }

  // Lets find movie stuff
  if (queMovies.length > 0) {
    logger.log({
      level: 'info',
      label: 'QueParse',
      message: `Found ${queMovies.length} movies in que`,
    });
    queStop();

    const folderName = queMovies.shift();
    const fullPath = path.join(config.settings.paths.movies, folderName);
    const settings = { folderName, fullPath, type: types.movies };
    isDirectory(Object.assign({}, settings))
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
        queStart(1);
      })
      .catch((e) => {
        logger.log({
          level: 'error',
          label: 'gather movies',
          message: 'Failed to load series',
          meta: e,
        });
        queStart(1);
      });
    return;
  }

  // Lets find Series stuff
  if (queSeries.length > 0) {
    logger.log({
      level: 'info',
      label: 'QueParse',
      message: `Found ${queSeries.length} series in que`,
    });
    queStop();

    const folderName = queSeries.shift();
    const fullPath = path.join(config.settings.paths.series, folderName);
    const settings = { folderName, fullPath, type: types.series };
    isDirectory(Object.assign({}, settings))
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
        queStart(1);
      })
      .catch((e) => {
        logger.log({
          level: 'error',
          label: 'gather series',
          message: 'Failed to load series',
          meta: e,
        });
        queStart(1);
      });
  }
};

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

module.exports = () => {
  listDirectory(config.settings.paths.movies).then((files) => {
    queMovies = queMovies.concat(files);
  });
  listDirectory(config.settings.paths.series).then((files) => {
    queSeries = queSeries.concat(files);
  });

  login()
    .then(() => {
      logger.log({
        level: 'info',
        label: 'opensubs',
        message: 'Connected',
      });
      queStart();
    })
    .catch((err) => {
      process.exit(`Failed to login ${err}`);
    });

  watch(config.settings.paths.series, { recursive: true }, (evt, name) => {
    watchFolder(config.settings.paths.series, name, types.series, evt)
      .then((f) => {
        queSeries.push(f);
      })
      .catch(() => {
        // do nothing
      });
  });
  watch(config.settings.paths.movies, { recursive: true }, (evt, name) => {
    watchFolder(config.settings.paths.movies, name, types.movies, evt)
      .then((f) => {
        queMovies.push(f);
      })
      .catch(() => {
        // do nothing
      });
  });
};
