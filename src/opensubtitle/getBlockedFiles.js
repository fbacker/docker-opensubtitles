import fs from 'fs';
import path from 'path';

export default (_data) => new Promise((resolve, reject) => {
  const data = { ..._data };

  const filePath = path.join(data.fullPath, '.opensubtitles');
  fs.readFile(filePath, 'utf8', (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // missing file, no biggie
        data.blocked = [];
        return resolve(data);
      }
      return reject(new Error(`Err ${err}`));
    }
    data.blocked = content.split('\n');
    return resolve(data);
  });
});
