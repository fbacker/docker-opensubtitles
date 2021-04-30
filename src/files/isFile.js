import fs from 'fs';

/**
 *  Is this a dir that we want to work on
 * */
export default (data) => new Promise((resolve, reject) => {
  const { logger } = global;
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
