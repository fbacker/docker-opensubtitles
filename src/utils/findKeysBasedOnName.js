const _ = require('lodash');
/**
 * Return all words from filename
 * @param {String} filename
 */
module.exports = (filename) => {
  const regSplitFile = /(\.|-)/g;
  return _.filter(filename.toLowerCase().split(regSplitFile), o => !o.match(regSplitFile));
};
