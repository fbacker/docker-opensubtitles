const fs = require('fs');
const path = require('path');

module.exports = _data => new Promise((resolve, reject) => {
  const data = Object.assign({}, _data);

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
