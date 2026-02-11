//middleware/rateLimiters.js
const rateLimit = require("express-rate-limit");

exports.authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: "RATE_LIMITED",
    message: "Too many login attempts. Please try again later.",
  },
});
