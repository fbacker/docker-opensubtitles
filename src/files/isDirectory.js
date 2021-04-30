import fs from 'fs';

/**
 *  Is this a dir that we want to work on
 * */
export default (data) => new Promise((resolve, reject) => {
  const { logger } = global;
  logger.log({
    level: 'info',
    label: 'isDirectory',
    message: `\n--------------------------------------------------------------\n\tNew Media: ${data.folderName}\n\tPath ${data.fullPath}\n--------------------------------------------------------------`,
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
