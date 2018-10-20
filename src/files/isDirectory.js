const fs = require('fs');
const globals = require('../globals');

const { logger } = globals;

/**
 *  Is this a dir that we want to work on
 * */
module.exports = data => new Promise((resolve, reject) => {
  logger.log({
    level: 'info',
    label: 'isDirectory',
    message: `\n--------------------------------------------------------------\n\tNew Media: ${
      data.folderName
    }\n\tPath ${data.fullPath}\n--------------------------------------------------------------`,
  });
  if (fs.lstatSync(data.fullPath).isDirectory()) {
    resolve(data);
  } else {
    logger.log({
      level: 'error',
      label: 'isDirectory',
      message: `This is not a folder ${data.fullPath}`,
    });
    reject(new Error(`This is not a folder ${data.fullPath}`));
  }
});
