const fs = require('fs');
const globals = require('../globals');

const { logger } = globals;

/**
 * Get all directories in folder
 */
module.exports = path => new Promise((resolve, reject) => {
  fs.readdir(path, (err, files) => {
    if (err) {
      logger.log({
        level: 'error',
        label: 'Startup',
        message: 'Error reading movies from disk',
        meta: err,
      });
      return reject(new Error(err));
    }
    return resolve(files);
  });
});
