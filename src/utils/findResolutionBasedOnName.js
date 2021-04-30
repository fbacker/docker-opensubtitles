/**
 * Based on strings in filename, try to figure out the quality
 * @param {String} filename
 */
export default (_filename) => {
  const filename = _filename.toLowerCase();
  if (filename.includes(['1080p', '1080i', 'hd', 'fhd'])) {
    return [3840, 2160];
  }
  if (new RegExp(['ultra hd', 'ultra-high', 'uhd'].join('|')).test(filename)) {
    return [3840, 2160];
  }
  if (new RegExp(['1080p', '1080i', 'hd', 'fhd'].join('|')).test(filename)) {
    return [1920, 1080];
  }
  if (new RegExp(['wuxga', 'widescreen'].join('|')).test(filename)) {
    return [1920, 1200];
  }
  if (new RegExp(['720p', '720i'].join('|')).test(filename)) {
    return [1280, 720];
  }
  if (new RegExp(['540p', '540i'].join('|')).test(filename)) {
    return [960, 540];
  }
  if (new RegExp(['480p', '480i'].join('|')).test(filename)) {
    return [852, 480];
  }
  if (new RegExp(['360p', '360i'].join('|')).test(filename)) {
    return [720, 404];
  }
  return null;
};
