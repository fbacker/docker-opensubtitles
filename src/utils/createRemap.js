/**
 * Create a function that maps a value to a range
 * @param  {Number}   inMin    Input range minimun value
 * @param  {Number}   inMax    Input range maximun value
 * @param  {Number}   outMin   Output range minimun value
 * @param  {Number}   outMax   Output range maximun value
 * @return {function}          A function that converts a value
 *
 * @author Victor N. wwww.victorborges.com
 * @see https://gist.github.com/victornpb/51b0c17241ea483dee2c3a20d0f710eb/
 */
export default (inMin, inMax, outMin, outMax) => function remaper(x) {
  return ((x - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};
