import md5 from 'md5';

/**
 *  Unique id to work with
 * */
export default (_data) => new Promise((resolve) => {
  const { logger } = global;
  const data = { ..._data };
  data.id = md5(data.fullPath);
  logger.log({
    level: 'info',
    label: 'create id',
    message: `Id ${data.id} from ${data.fullPath}`,
  });
  resolve(data);
});
