import fs from 'fs';

/**
 * Get a list of all files
 * @param {String} dir
 * @param {Function} done
 */
const collectFilesRecursive = (dir, done) => {
  let results = [];
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    let i = -1;
    (function next() {
      i += 1;
      let file = list[i];
      if (!file) return done(null, results);
      file = `${dir}/${file}`;
      fs.stat(file, (err1, stat) => {
        if (stat && stat.isDirectory()) {
          collectFilesRecursive(file, (err2, res) => {
            results = results.concat(res);
            next();
          });
        } else {
          results.push(file);
          next();
        }
      });
      return null;
    }());
    return null;
  });
};
export default collectFilesRecursive;
