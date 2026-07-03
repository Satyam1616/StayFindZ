/**
 * Upload Routes
 * /api/v1/uploads/*
 * 
 * Handles image uploads for listings and avatars via Cloudinary.
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/auth');
const { listingUploader, avatarUploader, getUploadedUrls, isConfigured } = require('../utils/upload');

// Upload rate limiter — 20 requests per minute per IP
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: {
    status: 'error',
    message: 'Too many upload requests. Please try again in a minute.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// All upload routes require authentication
router.use(authenticate);
router.use(uploadLimiter);

/**
 * POST /api/v1/uploads/listings
 * Upload listing images (up to 10)
 * Returns array of image URLs
 */
router.post(
  '/listings',
  authorize('host', 'admin'),
  (req, res, next) => {
    listingUploader.array('images', 10)(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ status: 'error', message: 'File too large. Max 5MB per image.' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ status: 'error', message: 'Too many files. Max 10 images.' });
        }
        return res.status(400).json({ status: 'error', message: err.message || 'Upload failed.' });
      }
      next();
    });
  },
  (req, res) => {
    const urls = getUploadedUrls(req.files);

    if (urls.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No images uploaded.' });
    }

    res.json({
      status: 'success',
      message: `${urls.length} image(s) uploaded successfully.`,
      data: {
        urls,
        cloudinary: isConfigured,
      },
    });
  }
);

/**
 * POST /api/v1/uploads/avatar
 * Upload user avatar (single file)
 * Returns the avatar URL
 */
router.post(
  '/avatar',
  (req, res, next) => {
    avatarUploader.single('avatar')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ status: 'error', message: 'File too large. Max 5MB.' });
        }
        return res.status(400).json({ status: 'error', message: err.message || 'Upload failed.' });
      }
      next();
    });
  },
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No image uploaded.' });
    }

    const url = req.file.path || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=80';

    res.json({
      status: 'success',
      message: 'Avatar uploaded successfully.',
      data: { url, cloudinary: isConfigured },
    });
  }
);

module.exports = router;
