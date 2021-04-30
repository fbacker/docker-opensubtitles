import collectFilesRecursive from '../utils/collectFilesRecursive.js';

/**
 * Get all files recursively
 * * @param {Object} data
 */
export default (_data) => new Promise((resolve, reject) => {
  const { logger } = global;
  const data = { ..._data };
  logger.log({
    level: 'info',
    label: 'findAll',
    message: 'Gather files recursivly',
  });
  collectFilesRecursive(data.fullPath, (err, results) => {
    if (err) {
      return reject(new Error(`Failed to gather files ${err}`));
    }
    data.files = results;
    logger.log({
      level: 'debug',
      label: 'findAll',
      message: `Found ${results.length}`,
      meta: results,
    });
    return resolve(data);
  });
});
