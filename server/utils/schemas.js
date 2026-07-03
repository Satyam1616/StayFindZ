/**
 * Zod Validation Schemas
 * Server-side input validation for all API endpoints
 */

const { z } = require('zod');

// ─── Auth Schemas ────────────────────────────────────────────────────────────

const registerSchema = {
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address').max(255),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    role: z.enum(['guest', 'host']).default('guest'),
  }),
};

const loginSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
};

const updateProfileSchema = {
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().max(20).optional().nullable(),
    avatarUrl: z.string().url().optional().nullable(),
  }),
};

const forgotPasswordSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
};

const resetPasswordSchema = {
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  }),
};

// ─── Listing Schemas ─────────────────────────────────────────────────────────

const createListingSchema = {
  body: z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(150),
    description: z.string().min(20, 'Description must be at least 20 characters'),
    type: z.enum(['entire_place', 'private_room', 'shared_room']),
    address: z.string().min(5),
    city: z.string().min(2).max(100),
    country: z.string().min(2).max(100),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    pricePerNight: z.number().positive('Price must be positive'),
    maxGuests: z.number().int().min(1).max(50),
    bedrooms: z.number().int().min(0).max(50),
    bathrooms: z.number().int().min(0).max(50),
    amenities: z.array(z.string()).default([]),
    images: z.array(z.string().url()).min(1, 'At least one image is required'),
  }),
};

const updateListingSchema = {
  body: z.object({
    title: z.string().min(5).max(150).optional(),
    description: z.string().min(20).optional(),
    type: z.enum(['entire_place', 'private_room', 'shared_room']).optional(),
    address: z.string().min(5).optional(),
    city: z.string().min(2).max(100).optional(),
    country: z.string().min(2).max(100).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    pricePerNight: z.number().positive().optional(),
    maxGuests: z.number().int().min(1).max(50).optional(),
    bedrooms: z.number().int().min(0).max(50).optional(),
    bathrooms: z.number().int().min(0).max(50).optional(),
    amenities: z.array(z.string()).optional(),
    images: z.array(z.string().url()).optional(),
    isActive: z.boolean().optional(),
  }),
};

const listingsQuerySchema = {
  query: z.object({
    search: z.string().max(200).optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    guests: z.coerce.number().int().positive().optional(),
    minPrice: z.coerce.number().positive().optional(),
    maxPrice: z.coerce.number().positive().optional(),
    type: z.enum(['entire_place', 'private_room', 'shared_room']).optional(),
    amenities: z.string().optional(), // CSV string
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
    sortBy: z.enum(['price_asc', 'price_desc', 'rating_desc', 'newest']).default('newest'),
  }),
};

// ─── Booking Schemas ─────────────────────────────────────────────────────────

const createBookingSchema = {
  body: z.object({
    listingId: z.string().min(1, 'Listing ID is required'),
    checkIn: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid check-in date'),
    checkOut: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid check-out date'),
    guests: z.number().int().positive(),
  }).refine(
    (data) => new Date(data.checkOut) > new Date(data.checkIn),
    { message: 'Check-out must be after check-in', path: ['checkOut'] }
  ),
};

// ─── Review Schemas ──────────────────────────────────────────────────────────

const createReviewSchema = {
  body: z.object({
    bookingId: z.string().min(1, 'Booking ID is required'),
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(10, 'Comment must be at least 10 characters'),
  }),
};

// ─── Common ──────────────────────────────────────────────────────────────────

const uuidParamSchema = {
  params: z.object({
    id: z.string().min(1, 'ID is required'),
  }),
};

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createListingSchema,
  updateListingSchema,
  listingsQuerySchema,
  createBookingSchema,
  createReviewSchema,
  uuidParamSchema,
};
