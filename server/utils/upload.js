/**
 * Cloudinary Upload Service
 * 
 * Handles image uploads for listings and avatars.
 * Falls back to keeping existing URL strings when Cloudinary is not configured.
 * 
 * Setup:
 *   1. Create a free Cloudinary account at https://cloudinary.com
 *   2. Get your credentials from Dashboard > Settings
 *   3. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to .env
 */

const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { logger } = require('./logger');

// Check if Cloudinary is configured
const isConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  logger.info('Cloudinary configured', { cloudName: process.env.CLOUDINARY_CLOUD_NAME });
} else {
  logger.warn('Cloudinary not configured — image uploads will use local placeholder URLs');
}

// ─── Multer + Cloudinary Storage ────────────────────────────────────────────

/**
 * Create a multer upload middleware for a specific folder
 */
function createUploader(folder, maxFiles = 10) {
  if (!isConfigured) {
    // Fallback: use memory storage (images won't be persisted to cloud)
    const memStorage = multer.memoryStorage();
    return multer({
      storage: memStorage,
      limits: { fileSize: 5 * 1024 * 1024, files: maxFiles }, // 5MB per file
      fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'), false);
        }
      },
    });
  }

  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `stayfinder/${folder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
      transformation: [
        { width: 1200, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
      ],
    },
  });

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: maxFiles },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    },
  });
}

// Pre-configured uploaders
const listingUploader = createUploader('listings', 10);
const avatarUploader = createUploader('avatars', 1);

/**
 * Upload a single image buffer to Cloudinary (programmatic upload)
 */
async function uploadImage(buffer, folder = 'listings', publicId = null) {
  if (!isConfigured) {
    logger.warn('Cloudinary not configured — returning placeholder');
    return { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', publicId: 'placeholder' };
  }

  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: `stayfinder/${folder}`,
      transformation: [
        { width: 1200, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
      ],
      ...(publicId && { public_id: publicId }),
    };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        logger.error('Cloudinary upload failed', { error: error.message });
        reject(error);
      } else {
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    });

    stream.end(buffer);
  });
}

/**
 * Delete an image from Cloudinary by public ID
 */
async function deleteImage(publicId) {
  if (!isConfigured || !publicId || publicId === 'placeholder') return;

  try {
    await cloudinary.uploader.destroy(publicId);
    logger.info('Cloudinary image deleted', { publicId });
  } catch (error) {
    logger.error('Cloudinary delete failed', { publicId, error: error.message });
  }
}

/**
 * Extract Cloudinary URLs from multer uploaded files
 * Works for both Cloudinary storage (file.path) and memory storage (fallback)
 */
function getUploadedUrls(files) {
  if (!files || files.length === 0) return [];

  return files.map((file) => {
    // CloudinaryStorage puts the URL in file.path
    if (file.path) return file.path;
    // Memory storage fallback — return a placeholder
    return 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80';
  });
}

module.exports = {
  cloudinary,
  isConfigured,
  listingUploader,
  avatarUploader,
  uploadImage,
  deleteImage,
  getUploadedUrls,
};
