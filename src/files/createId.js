const md5 = require('md5');
const globals = require('../globals');

const { logger } = globals;

/**
 *  Unique id to work with
 * */
module.exports = _data => new Promise((resolve) => {
  const data = Object.assign({}, _data);
  data.id = md5(data.fullPath);
  logger.log({
    level: 'info',
    label: 'create id',
    message: `Id ${data.id} from ${data.fullPath}`,
  });
  resolve(data);
});
