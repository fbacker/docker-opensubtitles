import _ from 'lodash';
import path from 'path';
import createRemap from '../utils/createRemap.js';
import findDuplicates from '../utils/findDuplicates.js';
import findKeysBasedOnName from '../utils/findKeysBasedOnName.js';
import findResolutionBasedOnName from '../utils/findResolutionBasedOnName.js';

// Try to calculate results from IMDB
// What is a best match for me?
export default (_data) => new Promise((resolve, reject) => {
  const { logger } = global;
  const data = { ..._data };
  logger.log({
    level: 'info',
    label: 'ReadFindBestMatch',
    message: `Find best subtitle match for ${data.fullPath}`,
  });
  data.downloads = [];
  Object.keys(data.api).forEach((key) => {
    let list = data.api[key];
    if (list.length > 0) {
      list = _.map(list, (_part) => {
        const mapFPS = createRemap(0, 5, 5, 0);
        const mapResolution = createRemap(0, 1000, 10, 0);

        const part = { ..._part };
        // console.log(data, part);
        const calculate = {};

        // how close to the FPS
        calculate.fps = part.fps ? mapFPS(Math.abs(data.fps - part.fps)) : 0;
        if (calculate.fps < 0) calculate.fps = 0;

        // OpenAPI score
        calculate.imdb = part.score ? part.score : 0;
        if (calculate.imdb < 0) calculate.imdb = 0;

        // How close are we to the file resolution
        calculate.resolution = 0;
        calculate.resolutions = findResolutionBasedOnName(part.filename);
        if (calculate.resolutions) {
          const c1 = Math.abs(data.width - calculate.resolutions[0]);
          const c2 = Math.abs(data.height - calculate.resolutions[1]);
          const c = c1 + c2;
          calculate.resolution = mapResolution(c);
        }
        if (calculate.resolution < 0) calculate.resolution = 0;

        // How many similar keys in the filenames
        const l = _.concat(findKeysBasedOnName(part.filename), findKeysBasedOnName(data.media));
        const keys = findDuplicates(l);
        calculate.keys = keys.length * 0.5;

        // Our new score
        calculate.score = calculate.imdb + calculate.fps + calculate.resolution + calculate.keys;
        part.calculate = calculate;

        logger.log({
          level: 'debug',
          label: 'ReadFindBestMatch',
          message: 'Calculated',
          meta: part,
        });
        return part;
      });
      const sorted = _.sortBy(list, (o) => parseInt(o.calculate.score * 10000, 10));
      _.reverse(sorted);
      const won = list[0];
      logger.log({
        level: 'debug',
        label: 'ReadFindBestMatch',
        message: 'Best result',
        meta: won,
      });
      const filename = `${path.parse(data.media).name}.${key}.${won.format}`;
      data.downloads.push({ url: won.url, id: won.id, filename });
    }
  });
  if (data.downloads.length === 0) {
    logger.log({
      level: 'error',
      label: 'ReadFindBestMatch',
      message: `No subtitles to download for ${data.fullPath}`,
      meta: data,
    });
    reject(new Error(`No subtitles to download for ${data.fullPath}`));
  } else {
    resolve(data);
  }
});
