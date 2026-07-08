const Redis = require('ioredis');

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err.message);
});

redisClient.on('connect', () => {
  console.log('Redis client connected');
});

const CACHE_TTL = {
  DEFAULT: 300,
  PRODUCTS: 600,
  CATEGORIES: 900,
  STORE: 600,
  USER: 300,
};

async function getOrSetCache(key, fetchFn, ttl = CACHE_TTL.DEFAULT) {
  try {
    const cached = await redisClient.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    const data = await fetchFn();
    if (data) {
      await redisClient.setex(key, ttl, JSON.stringify(data));
    }
    return data;
  } catch (error) {
    console.error('Cache error:', error.message);
    return fetchFn();
  }
}

async function invalidateCache(pattern) {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error.message);
  }
}

module.exports = redisClient;
module.exports.getOrSetCache = getOrSetCache;
module.exports.invalidateCache = invalidateCache;
module.exports.CACHE_TTL = CACHE_TTL;
