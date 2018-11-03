const config = require('config');
const winston = require('winston');
const fs = require('fs');
/*
const express = require('express');
const http = require('http');
const socket = require('socket.io');
const bodyParser = require('body-parser');
*/
const globals = require('./src/globals');

// let io;
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
  const log = new winston.transports.Console({
    level: 'debug',
    colorize: true,
    prettyPrint: true,
  });
  logger.add(log);

  globals.logger = logger;

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
  resolve();
});

/**
 * Read extra config to extend
 */
const readConfig = () => new Promise((resolve) => {
  let path = config.base.extend;
  if (process.env.NODE_ENV !== 'production') path = './test-config/local.json';
  fs.readFile(path, 'utf8', (err, content) => {
    let c = Object.assign({}, config);
    if (!err) {
      // no extra settings
      const e = JSON.parse(content);
      c = config.util.extendDeep({}, config, e);
      globals.logger.log({
        level: 'info',
        label: 'Startup',
        message: 'Loaded Settings Extends with settings',
        meta: c,
      });
    }
    globals.config = c;
    resolve();
  });
});
/*
const createWebServer = () => new Promise((resolve) => {
  const app = express();
  app.use(express.static('html'));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  // server is alive
  const server = http.createServer(app);
  server.listen(config.gui.port, () => {
    globals.logger.info(`GUI Web listen on port ${config.gui.port}`);
  });

  // websocket actions
  io = socket.listen(server);
  resolve();
});
*/
createLogger()
  .then(readConfig)
  .then(() => {
    require('./src/index')('start');
  })
  .catch((err) => {
    globals.logger.log({
      level: 'error',
      label: 'Startup',
      message: 'Failed to start',
      meta: err,
    });
  });
