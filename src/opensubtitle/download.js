import path from 'path';
import fs from 'fs';
import _ from 'lodash';
import fetch from 'node-fetch';

// Download a single subtitle
const download = (data) => new Promise((resolve, reject) => {
  const { config, logger } = global;
  logger.log({
    level: 'info',
    label: 'DownloadSubtitle',
    message: `Download subtitle ${data.filename}`,
  });
  fetch(data.url)
    .then((response) => {
      if (response.status === 200) {
        return response.text();
      }
      reject(new Error('Could not download'));
    })
    .then((content) => {
      if (!content) return;
      const filepath = path.join(config.settings.paths.tmp, data.filename);
      fs.writeFile(filepath, content, 'utf8', (err) => {
        if (err) {
          logger.log({
            level: 'error',
            label: 'DownloadSubtitle',
            message: 'Failed to write subtitle to tmp disk',
            meta: { ...data, filepath },
          });
          reject(new Error(`Write to disk failed for ${data.filename}`));
        } else {
          resolve(data);
        }
      });
    })
    .catch((err) => {
      logger.log({
        level: 'error',
        label: 'DownloadSubtitle',
        message: 'Failed to download subtitle',
        meta: err,
      });
      reject(new Error(`Failed to download ${data.filename}`));
    });
});

// Place a downloaded sub from tmp to actual position
const place = (data) => new Promise((resolve, reject) => {
  const { config, logger } = global;
  const from = path.join(config.settings.paths.tmp, data.filename);
  const to = path.join(data.filePath, data.filename);
  logger.log({
    level: 'info',
    label: 'PlaceSubtitles',
    message: 'Move downloaded subtitle',
    meta: { from, to },
  });

  fs.copyFile(from, to, (err) => {
    if (err) {
      logger.log({
        level: 'error',
        label: 'PlaceSubtitles',
        message: 'Failed to copy subtitle to final disk',
        meta: { ...data, from, to },
      });
      return reject(new Error(`Failed to copy file ${err}`));
    }
    return resolve(data);
  });
});

const saveCustomMeta = (data) => new Promise((resolve, reject) => {
  const { logger } = global;
  logger.log({
    level: 'info',
    label: 'PlaceCustom',
    message: 'Save custom subs id',
  });
  const filePath = path.join(data.fullPath, '.opensubtitles');
  const content = data.id;
  fs.appendFile(filePath, content, 'utf8', (err) => {
    if (err) {
      logger.log({
        level: 'error',
        label: 'DownloadSubtitle',
        message: 'Failed to write downloaded id to disk',
        meta: { ...data, filePath },
      });
      reject(new Error(`Write to disk failed for ${filePath}`));
    } else {
      resolve(data);
    }
  });
});

export default (data) => new Promise((resolve, reject) => {
  const { logger } = global;
  logger.log({
    level: 'info',
    label: 'DownloadSubtitles',
    message: `Download ${data.downloads.length} subtitles`,
  });
  const promises = [];
  _.each(data.downloads, (item) => {
    const filePath = path.parse(data.media).dir;
    const p = download({ ...item, filePath, fullPath: data.fullPath })
      .then(place)
      .then(saveCustomMeta);
    promises.push(p);
  });
  Promise.all(promises)
    .then(() => {
      logger.log({
        level: 'info',
        label: 'DownloadSubtitles',
        message: 'All subs are done',
      });
      resolve(data);
    })
    .catch((err) => {
      logger.log({
        level: 'error',
        label: 'DownloadSubtitles',
        message: 'An error occurred, we cant continue',
      });
      reject(new Error(`failed ${err}`));
    });
});
