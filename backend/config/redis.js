const Redis = require('ioredis');
const logger = require('./logger');

// Connect to Redis (defaults to 127.0.0.1:6379)
const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

redis.on('connect', () => {
  logger.info('Redis Connected successfully');
});

redis.on('error', (err) => {
  logger.error(`Redis connection error: ${err.message}`);
});

module.exports = redis;
