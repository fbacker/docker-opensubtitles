const globals = require('../globals');
const collectFilesRecursive = require('../utils/collectFilesRecursive');

const { logger } = globals;

/**
 * Get all files recursively
 * * @param {Object} data
 */
module.exports = _data => new Promise((resolve, reject) => {
  const data = Object.assign({}, _data);
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
