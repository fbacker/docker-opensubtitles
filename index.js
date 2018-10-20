const config = require('config');
const winston = require('winston');
const fs = require('fs');
const globals = require('./src/globals');

/**
 * Configure Logger for output
 */
const { combine, timestamp, printf } = winston.format;
const myFormat = printf((info) => {
  const meta = info.meta ? `\n${JSON.stringify(info.meta, null, 4)}` : '';
  return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}   ${meta}`;
});
const logfile = new Date()
  .toISOString()
  .split('T')
  .map(value => value.split('.')[0])
  .join('_');
const logger = winston.createLogger({
  level: config.logger.level,
  format: combine(timestamp(), myFormat),
  transports: [
    new winston.transports.File({
      filename: `logs/${logfile}_error.log`,
      level: 'error',
    }),
    new winston.transports.File({ filename: `logs/${logfile}_output.log` }),
  ],
});
// if (process.env.NODE_ENV !== 'production') {
const log = new winston.transports.Console({
  level: 'debug',
  colorize: true,
  prettyPrint: true,
});
logger.add(log);
// }

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
logger.log({
  level: 'info',
  label: 'Startup',
  message: 'Loaded Settings',
  meta: config.settings,
});

fs.readFile(config.base.extend, 'utf8', (err, content) => {
  let c = Object.assign({}, config);
  if (!err) {
    // no extra settings
    const e = JSON.parse(content);
    c = config.util.extendDeep({}, config, e);
  }
  globals.config = c;
  globals.logger = logger;
  require('./src')('start');
});
