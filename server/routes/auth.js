/**
 * Auth Routes
 * /api/v1/auth/*
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const { register, login, logout, refresh, getMe, updateMe } = require('../controllers/authController');
const { forgotPassword, resetPassword } = require('../controllers/passwordController');
const { googleAuth } = require('../controllers/googleAuthController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { sanitizeInput } = require('../middleware/sanitize');
const {
  registerSchema, loginSchema, updateProfileSchema,
  forgotPasswordSchema, resetPasswordSchema,
} = require('../utils/schemas');

// Rate limiting for login — 5 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    status: 'error',
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for password reset — 3 attempts per 15 minutes
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    status: 'error',
    message: 'Too many password reset attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post('/register', validate(registerSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/forgot-password', resetLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/google', googleAuth);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, sanitizeInput, validate(updateProfileSchema), updateMe);

module.exports = router;
