const log4js = require('log4js');

const levels = {
  all: log4js.levels.ALL,
  trace: log4js.levels.TRACE,
  debug: log4js.levels.DEBUG,
  info: log4js.levels.INFO,
  warn: log4js.levels.WARN,
  error: log4js.levels.ERROR,
  fatal: log4js.levels.FATAL,
}

log4js.configure({
  appenders: {
    console: { type: 'console' },
    info: { type: 'file', filename: 'logs/application.log' },
    error: { type: 'dateFile', filename: 'logs/error', pattern: 'yyyy-MM-dd.log' }
  },
  categories: {
    default: { appenders: ['console'], level: 'debug' },
    info: { appenders: ['info', 'console'], level: 'info' },
    error: { appenders: ['error', 'console'], level: 'error' }
  }
})

exports.debug = (content) => {
  const logger = log4js.getLogger('debug');
  logger.level = levels.debug;
  logger.debug(content)
}
exports.info = (content) => {
  const logger = log4js.getLogger('info');
  logger.level = levels.info;
  logger.info(content)
}
exports.error = (content) => {
  const logger = log4js.getLogger('error');
  logger.level = levels.error;
  logger.error(content)
}