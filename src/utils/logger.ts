import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import config from '../config/env';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level}]: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    }`;
  })
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: consoleFormat,
    level: config.logging.level,
  }),
];

if (config.nodeEnv !== 'test') {
  transports.push(
    new DailyRotateFile({
      filename: `${config.logging.dir}/error-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: logFormat,
      maxFiles: '30d',
      maxSize: '20m',
    }),
    new DailyRotateFile({
      filename: `${config.logging.dir}/combined-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      format: logFormat,
      maxFiles: '30d',
      maxSize: '20m',
    })
  );
}

const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports,
});

export default logger;
