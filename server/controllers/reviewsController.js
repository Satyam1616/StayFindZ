/**
 * Reviews Controller
 * Create and list reviews for listings
 */

const { AppError } = require('../middleware/errorHandler');
const { isReviewEligible, ensureBookingCompleted } = require('../utils/bookingHelpers');

// POST /api/v1/reviews — Create a review
const createReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment } = req.body;

    // Verify the booking exists and belongs to this user
    const booking = await req.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, guestId: true, listingId: true, status: true },
    });

    if (!booking) {
      throw new AppError('Booking not found.', 404);
    }

    if (booking.guestId !== req.user.id) {
      throw new AppError('You can only review your own bookings.', 403);
    }

    const updatedBooking = await ensureBookingCompleted(req.prisma, booking);

    if (!isReviewEligible(updatedBooking)) {
      throw new AppError('You can only review completed stays.', 400);
    }

    // Check if review already exists
    const existingReview = await req.prisma.review.findUnique({
      where: { bookingId },
    });

    if (existingReview) {
      throw new AppError('You have already reviewed this booking.', 409);
    }

    const review = await req.prisma.review.create({
      data: {
        bookingId,
        guestId: req.user.id,
        listingId: booking.listingId,
        rating,
        comment,
      },
      include: {
        guest: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Review submitted.',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/reviews/listing/:listingId — Reviews for a listing
const getListingReviews = async (req, res, next) => {
  try {
    const reviews = await req.prisma.review.findMany({
      where: { listingId: req.params.id },
      orderBy: { createdAt: 'desc' },
      include: {
        guest: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    // Calculate stats
    const ratings = reviews.map((r) => r.rating);
    const avgRating = ratings.length > 0
      ? parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
      : null;

    res.json({
      status: 'success',
      data: {
        reviews,
        stats: {
          avgRating,
          totalReviews: ratings.length,
          distribution: {
            5: ratings.filter((r) => r === 5).length,
            4: ratings.filter((r) => r === 4).length,
            3: ratings.filter((r) => r === 3).length,
            2: ratings.filter((r) => r === 2).length,
            1: ratings.filter((r) => r === 1).length,
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createReview, getListingReviews };
