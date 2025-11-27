import rateLimit from 'express-rate-limit';
import config from '../config/env';

export const globalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    timestamp: Date.now(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const createCustomRateLimiter = (maxRequests: number, windowMs: number = 60000) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: {
      success: false,
      message: 'Rate limit exceeded for this API',
      timestamp: Date.now(),
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later',
    timestamp: Date.now(),
  },
  skipSuccessfulRequests: true,
});
