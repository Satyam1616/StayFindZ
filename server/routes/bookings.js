/**
 * Bookings Routes
 * /api/v1/bookings/*
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const {
  createBooking, getBookingById, cancelBooking,
  getMyBookings, getHostBookings, approveBooking,
  rejectBooking, getHostStats,
} = require('../controllers/bookingsController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createBookingSchema, uuidParamSchema } = require('../utils/schemas');

// Stricter rate limit for booking creation — 10 per minute per IP
const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    status: 'error',
    message: 'Too many booking requests. Please try again in a minute.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// All booking routes require authentication
router.use(authenticate);

// Guest routes
router.post('/', bookingLimiter, authorize('guest', 'admin'), validate(createBookingSchema), createBooking);
router.get('/me', getMyBookings);

// Host routes — must come before /:id to avoid route conflicts
router.get('/hosting/me', authorize('host', 'admin'), getHostBookings);
router.get('/hosting/stats', authorize('host', 'admin'), getHostStats);

// Booking detail & actions
router.get('/:id', validate(uuidParamSchema), getBookingById);
router.patch('/:id/cancel', validate(uuidParamSchema), cancelBooking);
router.patch('/:id/approve', authorize('host', 'admin'), validate(uuidParamSchema), approveBooking);
router.patch('/:id/reject', authorize('host', 'admin'), validate(uuidParamSchema), rejectBooking);

module.exports = router;
