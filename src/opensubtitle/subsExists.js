const _ = require('lodash');
const globals = require('../globals');

module.exports = data => new Promise((resolve, reject) => {
  let count = 0;
  _.each(globals.languages, (lang) => {
    _.each(data.subs, (sub) => {
      if (lang === sub.lang) count += 1;
    });
  });

  if (globals.languages.length === count) {
    return reject(new Error(`Already got all subs for ${data.media}`));
  }

  return resolve(data);
});
