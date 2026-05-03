const winston = require('winston');

// Custom color scheme for each log level
winston.addColors({
  error:   'bold red',
  warn:    'bold yellow',
  info:    'bold cyan',
  success: 'bold green',
  http:    'bold magenta',
  debug:   'bold white',
});

// Add a custom 'success' level between info and warn
const customLevels = {
  levels: {
    error:   0,
    warn:    1,
    success: 2,
    info:    3,
    http:    4,
    debug:   5,
  },
  colors: {
    error:   'bold red',
    warn:    'bold yellow',
    success: 'bold green',
    info:    'bold cyan',
    http:    'bold magenta',
    debug:   'bold white',
  }
};

// Console format with colors and clear timestamp
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level}: ${message}`;
  })
);

// File format - plain text, no colors (colors break log files)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

const logger = winston.createLogger({
  levels: customLevels.levels,
  level: 'debug', // Log everything up to debug level
  transports: [
    // Error-only log file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat,
    }),
    // Combined log file (all levels)
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: fileFormat,
    }),
  ],
});

// Colorful console output only when not in production
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

// Apply the custom colors to winston
winston.addColors(customLevels.colors);

module.exports = logger;