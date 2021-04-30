import fs from 'fs';

/**
 * Get all directories in folder
 */
export default (path) => new Promise((resolve, reject) => {
  const { logger } = global;
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
