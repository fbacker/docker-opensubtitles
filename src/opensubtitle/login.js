const OS = require('opensubtitles-api');
const globals = require('../globals');

const { config, logger } = globals;

let loginRetires = 0;

globals.openSubtitles = new OS({
  useragent: 'TemporaryUserAgent',
  ssl: true,
  username: config.opensubtitles.username,
  password: config.opensubtitles.password,
});
// @TODO retry doesn't work
const login = () => new Promise((resolve, reject) => {
  logger.log({
    level: 'info',
    label: 'OpenSubtitle',
    message: 'Try to login',
  });
  globals.openSubtitles
    .login()
    .then((res) => {
      logger.log({
        level: 'info',
        label: 'OpenSubtitle',
        message: 'Connected',
      });
      logger.log({
        level: 'debug',
        label: 'OpenSubtitle',
        message: 'Response',
        meta: res,
      });

      let { languages } = config.opensubtitles;
      if (!languages) {
        try {
          let lng = res.userinfo.UserPreferedLanguages;
          lng = lng.split(',');
          if (lng && lng.length !== 0) {
            languages = lng;
            logger.log({
              level: 'info',
              label: 'OpenSubtitle',
              message: 'Changed language to Open Subtitles',
              meta: languages,
            });
          }
        } catch (err) {
          logger.log({
            level: 'error',
            label: 'OpenSubtitle',
            message: `failed to parse ${err}`,
          });
        }

        // check final, make sure something is here
        if (!languages) languages = ['eng'];
      }
      globals.languages = languages;
      globals.userToken = res.token;
      resolve();
    })
    .catch((err) => {
      logger.log({
        level: 'error',
        label: 'OpenSubtitle',
        message: 'Failed to login',
        meta: err,
      });
      loginRetires += 1;
      if ((loginRetires < login, config.opensubtitles.loginRetries)) {
        return setTimeout(() => {
          login();
        }, 10000);
      }
      return reject(err);
    });
});
module.exports = login;
