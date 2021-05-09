import config from 'config';
import winston from 'winston';
import fs from 'fs';
import startup from './src/index.js';

global.config = null;
global.logger = null;
global.userToken = null;
global.languages = [];
global.openSubtitles = null;

/**
 * Configure Logger for output
 */
const createLogger = () => new Promise((resolve) => {
  const { combine, timestamp, printf } = winston.format;
  const myFormat = printf((info) => {
    const meta = info.meta ? `\n${JSON.stringify(info.meta, null, 4)}` : '';
    return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}   ${meta}`;
  });
  const logfile = new Date()
    .toISOString()
    .split('T')
    .map((value) => value.split('.')[0])
    .join('_');
  const logger = winston.createLogger({
    level: config.logger.level,
    format: combine(timestamp(), myFormat),
    transports: [
      new winston.transports.File({
        filename: `logs/${logfile}_error.log`,
        level: 'error',
        tailable: true,
      }),
      new winston.transports.Console({
        level: 'debug',
        colorize: true,
        prettyPrint: true,
      }),
    ],
  });

  global.logger = logger;

  logger.log({
    level: 'info',
    label: 'Startup',
    message: 'Starting Open Subtitle Autogetter',
  });
  logger.log({
    level: 'info',
    label: 'Startup',
    message: '---------------------------------',
  });

  resolve();
});

/**
 * Read extra config to extend
 */
const readConfig = () => new Promise((resolve) => {
  const { logger } = global;
  let path = config.base.extend;
  if (process.env.NODE_ENV !== 'production') {
    path = './test-config/local.json';
  }
  fs.readFile(path, 'utf8', (err, content) => {
    let c = { ...config };
    if (err) {
      logger.info('No extra config file to merge');
    } else if (!err) {
      // no extra settings
      const e = JSON.parse(content);
      c = config.util.extendDeep({}, config, e);
    }

    const oun = process.env.USERNAME && process.env.USERNAME !== '' ? process.env.USERNAME : null;
    const oup = process.env.USERNAME && process.env.PASSWORD !== '' ? process.env.PASSWORD : null;
    if (oun) c.opensubtitles.username = oun;
    if (oup) c.opensubtitles.password = oun;

    logger.log({
      level: 'info',
      label: 'Startup',
      message: 'Loaded Settings',
      meta: c,
    });

    global.config = c;
    resolve();
  });
});

createLogger()
  .then(readConfig)
  .then(() => {
    startup();
  })
  .catch((err) => {
    const { logger } = global;
    if (logger) {
      logger.log({
        level: 'error',
        label: 'Startup',
        message: 'Failed to start',
        meta: err,
      });
    } else {
      console.error('Failed to start', err);
    }
    process.exit(1);
  });
