import _ from 'lodash';
/**
 * Return all words from filename
 * @param {String} filename
 */
export default (filename) => {
  const regSplitFile = /(\.|-)/g;
  return _.filter(filename.toLowerCase().split(regSplitFile), (o) => !o.match(regSplitFile));
};
