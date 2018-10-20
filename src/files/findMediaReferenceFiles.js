const _ = require('lodash');
const path = require('path');

module.exports = _data => new Promise((resolve) => {
  const data = Object.assign({}, _data);
  const media = path.basename(data.media, path.extname(data.media)).toLowerCase();
  data.season = null;
  data.episode = null;
  let sSeason = null;
  if (data.type === 'series') {
    const reFindSeasonEpisode = /s[0-9]{2,2}e[0-9]{2,2}/g;
    const reFindSeason = /^(\D*)(\d+)/g;
    const reFindEpisode = /(\D*)(\d+)$/g;
    const sSearch = media.match(reFindSeasonEpisode);
    if (sSearch && sSearch.length > 0) {
      [sSeason] = sSearch;
      let s = reFindSeason.exec(sSeason);
      if (s && s.length >= 2) {
        data.season = parseInt(s[2], 10);
      }
      s = reFindEpisode.exec(sSeason);
      if (s && s.length >= 2) {
        data.episode = parseInt(s[2], 10);
      }
    }
  }

  data.info = null;
  data.subs = [];

  // find all subs
  _.each(data.subtitles, (filepath) => {
    const name = path.basename(filepath, path.extname(filepath));
    let found = false;
    if (name.indexOf(media) === 0) {
      found = true;
    } else if (data.type === 'series' && sSeason) {
      if (filepath.toLowerCase().indexOf(sSeason) > 0) {
        found = true;
      }
    }
    if (found) {
      // @TODO figure out language
      const lang = 'eng';
      data.subs.push({ file: filepath, lang });
    }
  });
  // got some info file
  _.each(data.infos, (filepath) => {
    const name = path.basename(filepath, path.extname(filepath));
    if (name.indexOf(media) === 0) {
      data.info = filepath;
    }
  });
  resolve(data);
});
