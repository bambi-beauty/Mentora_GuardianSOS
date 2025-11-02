// middleware/rateLimit.js
import rateLimit from 'express-rate-limit';

export const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Please wait a moment before sending more messages'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again after 15 minutes'
  }
});