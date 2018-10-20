const path = require('path');
const globals = require('../globals');

const { logger, config } = globals;

/**
 *  Is this a dir that we want to work on
 * */
module.exports = data => new Promise((resolve, reject) => {
  logger.log({
    level: 'info',
    label: 'watch interested',
  });
  let doUpdate = false;
  const ext = path.extname(data.fullPath).toLowerCase();
  const filename = path.basename(data.fullPath);
  if (ext === '' && filename !== '.opensubtitles') {
    // ignore if missing filetype
  } else if (data.event === 'remove') {
    if (ext === '.srt') {
      doUpdate = true;
    } else if (filename !== '.opensubtitles') {
      doUpdate = true;
    }
  } else if (data.event === 'update') {
    // file created, moved or changed
    if (config.settings.fileTypes.media.includes(ext)) {
      doUpdate = true;
    }
  }

  if (doUpdate) {
    resolve(data);
  } else {
    reject();
  }
});
