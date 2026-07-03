/**
 * Bookings Controller
 * Create, cancel, and list bookings with date conflict detection
 * SQLite-compatible — images stored as JSON strings
 */

const { AppError } = require('../middleware/errorHandler');
const { ensureBookingCompleted } = require('../utils/bookingHelpers');
const { sendBookingConfirmationEmail, sendNewBookingNotificationEmail } = require('../utils/email');
const { logger } = require('../utils/logger');

/**
 * Parse listing images from JSON string
 */
const parseListingImages = (booking) => {
  if (!booking) return booking;
  if (booking.listing && typeof booking.listing.images === 'string') {
    booking.listing = {
      ...booking.listing,
      images: JSON.parse(booking.listing.images),
    };
  }
  return booking;
};

// POST /api/v1/bookings — Create a booking
const createBooking = async (req, res, next) => {
  try {
    const { listingId, checkIn, checkOut, guests } = req.body;
    const guestId = req.user.id;

    // Verify listing exists and is active
    const listing = await req.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, hostId: true, pricePerNight: true, maxGuests: true, isActive: true },
    });

    if (!listing || !listing.isActive) {
      throw new AppError('Listing not found or is inactive.', 404);
    }

    // Prevent hosts from booking their own listing
    if (listing.hostId === guestId) {
      throw new AppError('You cannot book your own listing.', 400);
    }

    // Validate guest count
    if (guests > listing.maxGuests) {
      throw new AppError(`Maximum ${listing.maxGuests} guests allowed for this listing.`, 400);
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Check for date conflicts (CRITICAL BUSINESS RULE)
    const conflictingBooking = await req.prisma.booking.findFirst({
      where: {
        listingId,
        status: { in: ['confirmed', 'pending'] },
        checkIn: { lt: checkOutDate },
        checkOut: { gt: checkInDate },
      },
    });

    if (conflictingBooking) {
      throw new AppError('This property is already booked for the selected dates.', 409);
    }

    // Calculate total price
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalPrice = parseFloat(listing.pricePerNight) * nights;

    // Create booking
    const booking = await req.prisma.booking.create({
      data: {
        guestId,
        listingId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests,
        totalPrice,
        status: 'pending', // Booking request mode: host must approve
      },
      include: {
        listing: {
          select: {
            id: true, title: true, city: true, country: true,
            images: true, pricePerNight: true, host: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
      },
    });

    // Send email notification to host about new booking request
    const hostEmail = booking.listing?.host;
    if (hostEmail) {
      const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      sendNewBookingNotificationEmail({
        to: hostEmail.email || 'host@example.com',
        hostName: hostEmail.name || 'Host',
        guestName: req.user.name,
        listingTitle: booking.listing.title,
        checkIn: fmtDate(booking.checkIn),
        checkOut: fmtDate(booking.checkOut),
        totalPrice: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(booking.totalPrice),
      }).catch(err => logger.error('Failed to send host notification', { error: err.message }));
    }

    res.status(201).json({
      status: 'success',
      message: 'Booking request submitted! The host will review it shortly.',
      data: { booking: parseListingImages(booking) },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/bookings/:id — Booking detail
const getBookingById = async (req, res, next) => {
  try {
    const booking = await req.prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        listing: {
          include: {
            host: {
              select: { id: true, name: true, avatarUrl: true, phone: true },
            },
          },
        },
        guest: {
          select: { id: true, name: true, avatarUrl: true, email: true, phone: true },
        },
        review: true,
      },
    });

    if (!booking) {
      throw new AppError('Booking not found.', 404);
    }

    // Only the guest or the host can view the booking
    if (booking.guestId !== req.user.id && booking.listing.hostId !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('Access denied.', 403);
    }

    const completedBooking = await ensureBookingCompleted(req.prisma, booking);
    if (completedBooking.status !== booking.status) {
      booking.status = completedBooking.status;
    }

    // Parse listing images and amenities
    if (booking.listing) {
      if (typeof booking.listing.images === 'string') {
        booking.listing.images = JSON.parse(booking.listing.images);
      }
      if (typeof booking.listing.amenities === 'string') {
        booking.listing.amenities = JSON.parse(booking.listing.amenities);
      }
    }

    res.json({ status: 'success', data: { booking } });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/bookings/:id/cancel — Cancel booking
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await req.prisma.booking.findUnique({
      where: { id: req.params.id },
      select: { id: true, guestId: true, status: true, listingId: true },
    });

    if (!booking) {
      throw new AppError('Booking not found.', 404);
    }

    if (booking.guestId !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('You can only cancel your own bookings.', 403);
    }

    if (booking.status === 'cancelled') {
      throw new AppError('Booking is already cancelled.', 400);
    }

    if (booking.status === 'completed') {
      throw new AppError('Cannot cancel a completed booking.', 400);
    }

    const updated = await req.prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'cancelled' },
      include: {
        listing: {
          select: { id: true, title: true, city: true },
        },
      },
    });

    res.json({
      status: 'success',
      message: 'Booking cancelled.',
      data: { booking: updated },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/users/me/bookings — Guest's bookings
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await req.prisma.booking.findMany({
      where: { guestId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          select: {
            id: true, title: true, city: true, country: true,
            images: true, pricePerNight: true,
            host: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        review: { select: { id: true, rating: true } },
      },
    });

    const updatedBookings = await Promise.all(
      bookings.map((b) => ensureBookingCompleted(req.prisma, b))
    );

    // Parse listing images
    const parsed = updatedBookings.map(parseListingImages);

    res.json({ status: 'success', data: { bookings: parsed } });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/users/me/hosting/bookings — Host's incoming bookings
const getHostBookings = async (req, res, next) => {
  try {
    const bookings = await req.prisma.booking.findMany({
      where: {
        listing: { hostId: req.user.id },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        guest: {
          select: { id: true, name: true, avatarUrl: true, email: true },
        },
        listing: {
          select: { id: true, title: true, city: true, images: true },
        },
      },
    });

    // Parse listing images
    const parsed = bookings.map(parseListingImages);

    res.json({ status: 'success', data: { bookings: parsed } });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/bookings/:id/approve — Host approves a pending booking
const approveBooking = async (req, res, next) => {
  try {
    const booking = await req.prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { listing: { select: { hostId: true, title: true } } },
    });

    if (!booking) throw new AppError('Booking not found.', 404);
    if (booking.listing.hostId !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('Only the listing host can approve bookings.', 403);
    }
    if (booking.status !== 'pending') {
      throw new AppError(`Cannot approve a ${booking.status} booking.`, 400);
    }

    const updated = await req.prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'confirmed' },
      include: {
        guest: { select: { id: true, name: true, email: true } },
        listing: { select: { id: true, title: true, city: true } },
      },
    });

    // In production: send email notification to guest
    const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    sendBookingConfirmationEmail({
      to: updated.guest.email,
      name: updated.guest.name,
      listingTitle: updated.listing.title,
      checkIn: fmtDate(booking.checkIn),
      checkOut: fmtDate(booking.checkOut),
      totalPrice: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(booking.totalPrice),
      bookingId: updated.id,
    }).catch(err => logger.error('Failed to send approval email', { error: err.message }));

    logger.info('Booking approved', { bookingId: updated.id, hostId: req.user.id });

    res.json({
      status: 'success',
      message: 'Booking approved.',
      data: { booking: updated },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/bookings/:id/reject — Host rejects a pending booking
const rejectBooking = async (req, res, next) => {
  try {
    const booking = await req.prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { listing: { select: { hostId: true, title: true } } },
    });

    if (!booking) throw new AppError('Booking not found.', 404);
    if (booking.listing.hostId !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('Only the listing host can reject bookings.', 403);
    }
    if (booking.status !== 'pending') {
      throw new AppError(`Cannot reject a ${booking.status} booking.`, 400);
    }

    const updated = await req.prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'cancelled' },
      include: {
        guest: { select: { id: true, name: true, email: true } },
        listing: { select: { id: true, title: true, city: true } },
      },
    });

    logger.info('Booking rejected', { bookingId: updated.id, hostId: req.user.id });

    res.json({
      status: 'success',
      message: 'Booking rejected.',
      data: { booking: updated },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/bookings/hosting/stats — Host earnings & stats
const getHostStats = async (req, res, next) => {
  try {
    const hostId = req.user.id;

    // Get all bookings for host's listings
    const bookings = await req.prisma.booking.findMany({
      where: {
        listing: { hostId },
        status: { in: ['confirmed', 'completed'] },
      },
      select: {
        totalPrice: true,
        status: true,
        checkIn: true,
        checkOut: true,
        createdAt: true,
      },
    });

    // Calculate stats
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const completedBookings = bookings.filter(b => b.status === 'completed').length;
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;

    // Monthly revenue (last 6 months)
    const now = new Date();
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthName = monthDate.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      const revenue = bookings
        .filter(b => {
          const d = new Date(b.createdAt);
          return d >= monthDate && d <= monthEnd;
        })
        .reduce((sum, b) => sum + b.totalPrice, 0);
      monthlyRevenue.push({ month: monthName, revenue });
    }

    // Get pending bookings count
    const pendingCount = await req.prisma.booking.count({
      where: { listing: { hostId }, status: 'pending' },
    });

    // Get total listings count
    const listingCount = await req.prisma.listing.count({
      where: { hostId, isActive: true },
    });

    // Average rating across all listings
    const reviews = await req.prisma.review.findMany({
      where: { listing: { hostId } },
      select: { rating: true },
    });
    const avgRating = reviews.length > 0
      ? parseFloat((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1))
      : null;

    res.json({
      status: 'success',
      data: {
        stats: {
          totalRevenue,
          completedBookings,
          confirmedBookings,
          pendingCount,
          listingCount,
          totalReviews: reviews.length,
          avgRating,
          monthlyRevenue,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getBookingById,
  cancelBooking,
  getMyBookings,
  getHostBookings,
  approveBooking,
  rejectBooking,
  getHostStats,
};
