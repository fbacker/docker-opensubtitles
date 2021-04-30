import path from 'path';
import _ from 'lodash';
import watch from 'node-watch';
import fs from 'fs';
import login from './opensubtitle/login.js';
import listDirectory from './files/listDirectory.js';
import isDirectory from './files/isDirectory.js';
import findAll from './files/findAll.js';
import getAndExtractFiles from './files/getAndExtractFiles.js';
import findMediaReferenceFiles from './files/findMediaReferenceFiles.js';
import subsExists from './opensubtitle/subsExists.js';
import readMetadata from './files/readMetadata.js';
import lookupIMDB from './files/lookupIMDB.js';
import search from './opensubtitle/search.js';
import match from './opensubtitle/match.js';
import download from './opensubtitle/download.js';
import getBlockedFiles from './opensubtitle/getBlockedFiles.js';
import cleanBlockedFiles from './opensubtitle/clean.js';
import isFile from './files/isFile.js';
import watchInteresting from './files/watchInteresting.js';
import createId from './files/createId.js';

const types = Object.freeze({ series: 'series', movies: 'movies' });
let queMovies = [];
let queSeries = [];
const queItems = [];

let queLookupIsRunning = false;
let queIsRunning = false;

const queParse = () => {
  const { userToken, logger } = global;
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

  if (!userToken) {
    logger.log({
      level: 'error',
      label: 'QueParse',
      message: 'Not logged in to opensubtitles.',
    });
    // @TODO need to re login

    login()
      .then(() => {
        logger.log({
          level: 'info',
          label: 'opensubs',
          message: 'Connected',
        });
        queIsRunning = false;
      })
      .catch((err) => {
        process.exit(`Failed to login ${err}`);
      });
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
  const { config, logger } = global;
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
    isDirectory({ ...settings })
      .then(createId)
      .then(findAll)
      .then(getAndExtractFiles)
      .then((obj) => {
        _.each(obj.medias, (media) => {
          const qItem = { ...settings, ...obj, media };
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
    isDirectory({ ...settings })
      .then(createId)
      .then(findAll)
      .then(getAndExtractFiles)
      .then((obj) => {
        _.each(obj.medias, (media) => {
          const qItem = { ...settings, ...obj, media };
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
  const { config, logger } = global;
  logger.log({
    level: 'debug',
    label: 'setup',
    message: 'Setup watch and list all directories',
  });

  if (config.settings.paths.movies) {
    if (fs.existsSync(config.settings.paths.movies)) {
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
    } else {
      logger.error(`Folder doesn't exists for movies ${config.settings.paths.movies}`);
      process.exit(1);
    }
    listDirectory(config.settings.paths.movies).then((files) => {
      queMovies = queMovies.concat(files);
    });
  }

  if (config.settings.paths.series) {
    if (fs.existsSync(config.settings.paths.series)) {
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
    } else {
      logger.error(`Folder doesn't exists for series ${config.settings.paths.series}`);
      process.exit(1);
    }
    listDirectory(config.settings.paths.series).then((files) => {
      queSeries = queSeries.concat(files);
    });
  }
};

export default () => login()
  .then(() => {
    const { logger } = global;
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
