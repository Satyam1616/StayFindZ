/**
 * Listings Controller
 * CRUD operations with search, filtering, and pagination
 * Arrays (amenities, images) stored as JSON strings in text columns
 */

const { AppError } = require('../middleware/errorHandler');

/**
 * Parse JSON string fields from SQLite storage
 */
const parseListing = (listing) => {
  if (!listing) return listing;
  return {
    ...listing,
    amenities: typeof listing.amenities === 'string' ? JSON.parse(listing.amenities) : listing.amenities,
    images: typeof listing.images === 'string' ? JSON.parse(listing.images) : listing.images,
  };
};

// GET /api/v1/listings — Paginated list with filters
const getListings = async (req, res, next) => {
  try {
    const {
      city, country, checkIn, checkOut, guests,
      minPrice, maxPrice, type, search,
      sortBy,
    } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    // Build dynamic where clause
    const where = { isActive: true };

    // Full-text search across title, description, and city
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { city: { contains: search } },
        { country: { contains: search } },
      ];
    }

    // Filter by specific fields
    if (city) where.city = { contains: city };
    if (country) where.country = { contains: country };
    if (type) where.type = type;
    if (guests) where.maxGuests = { gte: parseInt(guests) };

    if (minPrice || maxPrice) {
      where.pricePerNight = {};
      if (minPrice) where.pricePerNight.gte = parseFloat(minPrice);
      if (maxPrice) where.pricePerNight.lte = parseFloat(maxPrice);
    }

    // Date availability filter — exclude listings with conflicting bookings
    if (checkIn && checkOut) {
      where.bookings = {
        none: {
          status: { in: ['confirmed', 'pending'] },
          checkIn: { lt: new Date(checkOut) },
          checkOut: { gt: new Date(checkIn) },
        },
      };
    }

    // Sorting
    let orderBy = {};
    switch (sortBy) {
      case 'price_asc':
        orderBy = { pricePerNight: 'asc' };
        break;
      case 'price_desc':
        orderBy = { pricePerNight: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const skip = (page - 1) * limit;

    // Execute query with count
    const [listings, total] = await Promise.all([
      req.prisma.listing.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          host: {
            select: { id: true, name: true, avatarUrl: true, createdAt: true },
          },
          reviews: {
            select: { rating: true },
          },
        },
      }),
      req.prisma.listing.count({ where }),
    ]);

    // Calculate average rating and parse JSON fields
    let listingsWithRating = listings.map((listing) => {
      const ratings = listing.reviews.map((r) => r.rating);
      const avgRating = ratings.length > 0
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : null;

      const { reviews, ...rest } = parseListing(listing);
      return {
        ...rest,
        avgRating: avgRating ? parseFloat(avgRating) : null,
        reviewCount: ratings.length,
      };
    });

    if (sortBy === 'rating_desc') {
      listingsWithRating = listingsWithRating.sort(
        (a, b) => (b.avgRating || 0) - (a.avgRating || 0)
      );
    }

    res.json({
      status: 'success',
      data: {
        listings: listingsWithRating,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/listings/:id — Full listing detail
const getListingById = async (req, res, next) => {
  try {
    const listing = await req.prisma.listing.findUnique({
      where: { id: req.params.id },
      include: {
        host: {
          select: { id: true, name: true, avatarUrl: true, createdAt: true },
        },
        reviews: {
          include: {
            guest: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!listing) {
      throw new AppError('Listing not found.', 404);
    }

    const parsed = parseListing(listing);

    // Calculate average rating
    const ratings = parsed.reviews.map((r) => r.rating);
    const avgRating = ratings.length > 0
      ? parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
      : null;

    res.json({
      status: 'success',
      data: {
        listing: {
          ...parsed,
          avgRating,
          reviewCount: ratings.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/listings — Create listing (host only)
const createListing = async (req, res, next) => {
  try {
    const { amenities, images, ...rest } = req.body;

    const listing = await req.prisma.listing.create({
      data: {
        ...rest,
        hostId: req.user.id,
        amenities: JSON.stringify(amenities || []),
        images: JSON.stringify(images || []),
      },
      include: {
        host: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Listing created successfully.',
      data: { listing: parseListing(listing) },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/listings/:id — Update listing (owner only)
const updateListing = async (req, res, next) => {
  try {
    // Verify ownership
    const existing = await req.prisma.listing.findUnique({
      where: { id: req.params.id },
      select: { hostId: true },
    });

    if (!existing) {
      throw new AppError('Listing not found.', 404);
    }

    if (existing.hostId !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('You can only edit your own listings.', 403);
    }

    const { amenities, images, ...rest } = req.body;
    const updateData = { ...rest };
    if (amenities) updateData.amenities = JSON.stringify(amenities);
    if (images) updateData.images = JSON.stringify(images);

    const listing = await req.prisma.listing.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json({
      status: 'success',
      message: 'Listing updated.',
      data: { listing: parseListing(listing) },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/listings/:id — Soft delete (sets isActive = false)
const deleteListing = async (req, res, next) => {
  try {
    const existing = await req.prisma.listing.findUnique({
      where: { id: req.params.id },
      select: { hostId: true },
    });

    if (!existing) {
      throw new AppError('Listing not found.', 404);
    }

    if (existing.hostId !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('You can only delete your own listings.', 403);
    }

    await req.prisma.listing.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({ status: 'success', message: 'Listing deactivated.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/listings/:id/availability — Booked date ranges
const getAvailability = async (req, res, next) => {
  try {
    const bookings = await req.prisma.booking.findMany({
      where: {
        listingId: req.params.id,
        status: { in: ['confirmed', 'pending'] },
        checkOut: { gte: new Date() }, // Only future/current bookings
      },
      select: {
        checkIn: true,
        checkOut: true,
      },
      orderBy: { checkIn: 'asc' },
    });

    res.json({
      status: 'success',
      data: { bookedDates: bookings },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/users/me/listings — Host's own listings
const getMyListings = async (req, res, next) => {
  try {
    const listings = await req.prisma.listing.findMany({
      where: { hostId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        reviews: { select: { rating: true } },
        _count: { select: { bookings: true } },
      },
    });

    const listingsWithStats = listings.map((listing) => {
      const ratings = listing.reviews.map((r) => r.rating);
      const avgRating = ratings.length > 0
        ? parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
        : null;
      const { reviews, ...rest } = parseListing(listing);
      return { ...rest, avgRating, reviewCount: ratings.length };
    });

    res.json({
      status: 'success',
      data: { listings: listingsWithStats },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  getAvailability,
  getMyListings,
};
