const { rateLimit } = require('express-rate-limit');

// Max 5 login attempts per IP every 15 minutes, to slow down password guessing
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: "Too many login attempts. Please try again after 15 minutes." },
});

// Max 3 reset emails per IP every hour, to stop inbox spamming and email enumeration
const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 3,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: "Too many password reset requests. Please try again after an hour." },
});

module.exports = { loginLimiter, forgotPasswordLimiter };
