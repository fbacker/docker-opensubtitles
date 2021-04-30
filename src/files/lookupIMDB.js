import _ from 'lodash';
import fs from 'fs';

const checkFile = (path) => new Promise((resolve, reject) => {
  const { logger } = global;
  const regImdb = /imdb.com\/title\/tt(\d)+/g;
  const regImdbTitle = /tt(\d)+/g;
  fs.readFile(path, 'utf8', (err, contents) => {
    if (err) return reject(new Error(`Error reading file ${path}`));
    let list = contents.match(regImdb);
    if (list) {
      for (let j = 0; j < list.length; j += 1) {
        const id = list[j].match(regImdbTitle);
        if (id) {
          logger.log({
            level: 'debug',
            label: 'ReadIMDB',
            message: 'Found id',
            meta: { imdb: id, file: path },
          });
          return resolve(id);
        }
      }
    }
    list = contents.match(regImdbTitle);
    if (list) {
      const [id] = list;
      logger.log({
        level: 'debug',
        label: 'ReadIMDB',
        message: 'Found id',
        meta: { imdb: id, file: path },
      });
      return resolve(id);
    }
    return resolve(null);
  });
});

// Look for IMDB id in files
export default (_data) => new Promise((resolve) => {
  const { logger } = global;
  const data = { ..._data };
  logger.log({
    level: 'info',
    label: 'ReadIMDB',
    message: 'Look for IMDB id in files',
    meta: data.info,
  });

  data.imdb = null;

  // not finding info simple, lets dig deeper
  const checkLotsOfFiles = () => {
    const sublen = data.fullPath.length + 1;
    const list = _.map([...data.infos], (item) => item.substring(sublen, item.length));
    list.sort((a, b) => {
      const al = a.split('/').length;
      const bl = b.split('/').length;
      if (al < bl) return -1;
      if (al > bl) return 1;
      if (a < b) return -1;
      if (a > b) return 1;
      // names must be equal
      return 0;
    });
    const p = [];
    _.forEach(list, (item) => {
      p.push(checkFile(`${data.fullPath}/${item}`));
    });
    Promise.all(p)
      .then((_imdb) => {
        const imdb = _.compact(_imdb);
        if (imdb.length > 0) {
          [data.imdb] = imdb;
        }
        resolve(data);
      })
      .catch(() => {
        resolve(data);
      });
  };

  checkFile(data.info)
    .then((id) => {
      if (id) {
        data.imdb = id;
        resolve(data);
      } else {
        checkLotsOfFiles();
      }
    })
    .catch(() => {
      checkLotsOfFiles();
    });
});
