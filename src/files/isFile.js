const fs = require('fs');
const globals = require('../globals');

const { logger } = globals;

/**
 *  Is this a dir that we want to work on
 * */
module.exports = data => new Promise((resolve, reject) => {
  if (data.event && data.event === 'remove') {
    return resolve(data);
  }
  fs.stat(data.fullPath, (err, stats) => {
    if (!err && stats.isFile()) {
      return resolve(data);
    }
    logger.log({
      level: 'error',
      label: 'isFile',
      message: `This is not a file ${data.fullPath}`,
    });
    return reject(new Error(`This is not a folder ${data.fullPath}`));
  });
});
