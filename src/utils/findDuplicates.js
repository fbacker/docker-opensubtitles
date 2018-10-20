const _ = require('lodash');
/**
 * Return all duplicates as single values and remove the rest
 * E.g. Combine multiple arrays and run this, everthing that has
 * more than two of the same is returned
 * @param {Array} arr
 */
module.exports = (arr) => {
  const object = {};
  const result = [];
  _.forEach(arr, (item) => {
    if (!object[item]) object[item] = 0;
    object[item] += 1;
  });
  Object.keys(object).forEach((key) => {
    if (object[key] >= 2) {
      result.push(key);
    }
  });
  return result;
};
