const globals = require('../globals');

module.exports = _data => new Promise((resolve, reject) => {
  const data = Object.assign({}, _data);
  data.lang = [...globals.languages];
  for (let i = data.lang.length - 1; i >= 0; i -= 1) {
    for (let j = 0; j < data.subs.length; j += 1) {
      if (data.lang[i] === data.subs[j].lang) {
        data.lang.splice(i, 1);
      }
    }
  }
  if (data.lang.length === 0) {
    return reject(new Error(`Already got all subs for ${data.media}`));
  }

  return resolve(data);
});
