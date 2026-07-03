/**
 * Listings Routes
 * /api/v1/listings/*
 */

const express = require('express');
const router = express.Router();

const {
  getListings, getListingById, createListing,
  updateListing, deleteListing, getAvailability, getMyListings,
} = require('../controllers/listingsController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { sanitizeInput } = require('../middleware/sanitize');
const {
  createListingSchema, updateListingSchema,
  listingsQuerySchema, uuidParamSchema,
} = require('../utils/schemas');

// Public routes
router.get('/', validate(listingsQuerySchema), getListings);
router.get('/:id', validate(uuidParamSchema), getListingById);
router.get('/:id/availability', validate(uuidParamSchema), getAvailability);

// Host-only routes — sanitize user-generated text before validation
router.post('/', authenticate, authorize('host', 'admin'), sanitizeInput, validate(createListingSchema), createListing);
router.patch('/:id', authenticate, authorize('host', 'admin'), sanitizeInput, validate(uuidParamSchema), validate(updateListingSchema), updateListing);
router.delete('/:id', authenticate, authorize('host', 'admin'), validate(uuidParamSchema), deleteListing);

// Host dashboard — own listings
router.get('/me/listings', authenticate, authorize('host', 'admin'), getMyListings);

module.exports = router;
