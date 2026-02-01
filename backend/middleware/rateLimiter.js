const rateLimit = require('express-rate-limit');
const config = require('../config');

const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: { success: false, error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const redirectLimiter = rateLimit({
  windowMs: 60000,
  max: 300,
  message: 'Too many redirect requests.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { apiLimiter, redirectLimiter };
