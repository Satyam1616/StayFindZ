/**
 * Payment Routes
 * /api/v1/payments/*
 * 
 * Stripe Checkout integration for booking payments
 */

const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth');
const { createCheckoutSession, verifyCheckoutSession, constructWebhookEvent } = require('../utils/stripe');
const { logger } = require('../utils/logger');

/**
 * POST /api/v1/payments/create-checkout-session
 * Creates a Stripe Checkout Session for a booking
 * Body: { bookingId }
 */
router.post('/create-checkout-session', authenticate, async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ status: 'error', message: 'bookingId is required.' });
    }

    const booking = await req.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: {
          select: { title: true, images: true, pricePerNight: true },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ status: 'error', message: 'Booking not found.' });
    }

    if (booking.guestId !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Not your booking.' });
    }

    if (booking.stripePaymentId) {
      return res.status(400).json({ status: 'error', message: 'Payment already processed.' });
    }

    // Parse images
    let images = [];
    try {
      images = typeof booking.listing.images === 'string'
        ? JSON.parse(booking.listing.images)
        : booking.listing.images || [];
    } catch { images = []; }

    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const fmtDate = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    const session = await createCheckoutSession({
      bookingId: booking.id,
      listingTitle: booking.listing.title,
      listingImage: images[0] || null,
      checkIn: fmtDate(checkInDate),
      checkOut: fmtDate(checkOutDate),
      totalPrice: booking.totalPrice,
      guestEmail: req.user.email,
      nights,
      pricePerNight: booking.listing.pricePerNight,
    });

    // If test mode, mark booking as paid immediately
    if (session.testMode) {
      await req.prisma.booking.update({
        where: { id: bookingId },
        data: { stripePaymentId: session.sessionId },
      });
    }

    res.json({
      status: 'success',
      data: {
        sessionId: session.sessionId,
        url: session.url,
        testMode: session.testMode,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/payments/verify/:sessionId
 * Verify a completed checkout session
 */
router.get('/verify/:sessionId', authenticate, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const result = await verifyCheckoutSession(sessionId);

    if (result.paid && result.bookingId) {
      // Update booking with payment info
      await req.prisma.booking.update({
        where: { id: result.bookingId },
        data: {
          stripePaymentId: result.paymentIntentId || sessionId,
        },
      });
    }

    res.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/payments/webhook
 * Stripe webhook handler — receives events like checkout.session.completed
 * IMPORTANT: This route must use raw body parsing (not JSON)
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = constructWebhookEvent(req.body, sig);

    if (!event) {
      // Webhook not configured — ignore
      return res.json({ received: true });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const bookingId = session.client_reference_id;

        if (bookingId) {
          await req.prisma.booking.update({
            where: { id: bookingId },
            data: {
              stripePaymentId: session.payment_intent,
              status: 'confirmed',
            },
          });
          logger.info('Payment confirmed via webhook', { bookingId, paymentIntent: session.payment_intent });
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        const bookingId = session.client_reference_id;
        logger.warn('Checkout session expired', { bookingId });
        break;
      }

      default:
        logger.info('Unhandled Stripe event', { type: event.type });
    }

    res.json({ received: true });
  } catch (err) {
    logger.error('Webhook error', { error: err.message });
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

module.exports = router;
