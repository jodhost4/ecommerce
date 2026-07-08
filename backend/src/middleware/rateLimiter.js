const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased from 100
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Increased from 10
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  skipSuccessfulRequests: true,
});

const storeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // Increased from 200
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.params.storeId || req.query.storeId || req.body?.storeId || req.ip;
  },
  message: {
    success: false,
    message: 'Too many requests for this store, please try again later.',
  },
});

module.exports = { generalLimiter, authLimiter, storeLimiter };
