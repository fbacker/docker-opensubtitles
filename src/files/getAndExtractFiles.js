const path = require('path');
const _ = require('lodash');
const globals = require('../globals');

const { config, logger } = globals;

/**
 * Get media files that we are interrested in
 */
module.exports = _data => new Promise((resolve, reject) => {
  const data = Object.assign({}, _data);
  logger.log({
    level: 'info',
    label: 'getAndExtractFiles',
    message: `Path ${data.fullPath}`,
  });

  data.medias = [];
  data.subtitles = [];
  data.infos = [];

  _.forEach(data.files, (name) => {
    const ext = path.extname(name).toLowerCase();
    const filename = path.basename(name);
    if (filename.indexOf('.') !== 0) {
      if (config.settings.fileTypes.subtitles.includes(ext)) {
        data.subtitles.push(name);
      }
      if (config.settings.fileTypes.media.includes(ext)) {
        // @TODO ignore trailers
        data.medias.push(name);
      }
      if (config.settings.fileTypes.info.includes(ext)) {
        data.infos.push(name);
      }
    }
  });

  // No media at all
  if (data.medias.length === 0) {
    logger.log({
      level: 'error',
      label: 'getAndExtractFiles',
      message: `No media file exists for ${data.fullPath}`,
    });
    return reject(new Error(`No media file exist for ${data.fullPath}`));
  }

  resolve(data);
});
