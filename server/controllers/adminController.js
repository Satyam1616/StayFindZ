/**
 * Admin Controller — platform management
 */

const { AppError } = require('../middleware/errorHandler');

const parseListing = (listing) => {
  if (!listing) return listing;
  return {
    ...listing,
    amenities: typeof listing.amenities === 'string' ? JSON.parse(listing.amenities) : listing.amenities,
    images: typeof listing.images === 'string' ? JSON.parse(listing.images) : listing.images,
  };
};

const getStats = async (req, res, next) => {
  try {
    const [users, listings, bookings, reviews] = await Promise.all([
      req.prisma.user.count(),
      req.prisma.listing.count(),
      req.prisma.booking.count(),
      req.prisma.review.count(),
    ]);

    res.json({
      status: 'success',
      data: {
        stats: { users, listings, bookings, reviews },
      },
    });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await req.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        _count: { select: { listings: true, bookings: true } },
      },
    });

    res.json({ status: 'success', data: { users } });
  } catch (error) {
    next(error);
  }
};

const getAllListings = async (req, res, next) => {
  try {
    const listings = await req.prisma.listing.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        host: { select: { id: true, name: true, email: true } },
        _count: { select: { bookings: true, reviews: true } },
      },
    });

    res.json({
      status: 'success',
      data: { listings: listings.map(parseListing) },
    });
  } catch (error) {
    next(error);
  }
};

const toggleListingActive = async (req, res, next) => {
  try {
    const listing = await req.prisma.listing.findUnique({
      where: { id: req.params.id },
    });

    if (!listing) {
      throw new AppError('Listing not found.', 404);
    }

    const updated = await req.prisma.listing.update({
      where: { id: req.params.id },
      data: { isActive: !listing.isActive },
    });

    res.json({
      status: 'success',
      message: updated.isActive ? 'Listing activated.' : 'Listing deactivated.',
      data: { listing: parseListing(updated) },
    });
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['guest', 'host', 'admin'].includes(role)) {
      throw new AppError('Invalid role.', 400);
    }

    const user = await req.prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    res.json({
      status: 'success',
      message: 'User role updated.',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getUsers,
  getAllListings,
  toggleListingActive,
  updateUserRole,
};
