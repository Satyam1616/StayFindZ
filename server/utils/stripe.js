/**
 * Stripe Payment Service
 * 
 * Creates Checkout Sessions for booking payments.
 * Falls back to a "test mode" when STRIPE_SECRET_KEY is not set.
 * 
 * Setup:
 *   1. Create a Stripe account at https://stripe.com
 *   2. Get your test keys from Developers > API keys
 *   3. Add STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY to .env
 *   4. For webhooks: set STRIPE_WEBHOOK_SECRET
 */

const { logger } = require('./logger');

const isConfigured = !!process.env.STRIPE_SECRET_KEY;

const stripe = isConfigured
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

if (isConfigured) {
  logger.info('Stripe configured');
} else {
  logger.warn('Stripe not configured — payments will use test mode (no real charges)');
}

/**
 * Create a Stripe Checkout Session for a booking
 */
async function createCheckoutSession({
  bookingId,
  listingTitle,
  listingImage,
  checkIn,
  checkOut,
  totalPrice,
  guestEmail,
  nights,
  pricePerNight,
}) {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  // If Stripe is not configured, return a test session
  if (!stripe) {
    logger.info('Stripe test mode: creating mock checkout session', { bookingId, totalPrice });
    return {
      sessionId: `test_session_${bookingId}_${Date.now()}`,
      url: `${clientUrl}/booking-confirmation?bookingId=${bookingId}&payment=test_success`,
      testMode: true,
    };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: guestEmail,
      client_reference_id: bookingId,
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: listingTitle,
              description: `${nights} night${nights > 1 ? 's' : ''} · ${checkIn} to ${checkOut}`,
              ...(listingImage && { images: [listingImage] }),
            },
            unit_amount: Math.round(totalPrice * 100), // Stripe uses smallest currency unit (paise)
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId,
        checkIn,
        checkOut,
        nights: String(nights),
      },
      success_url: `${clientUrl}/booking-confirmation?bookingId=${bookingId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/listings?payment=cancelled`,
    });

    logger.info('Stripe checkout session created', { sessionId: session.id, bookingId });

    return {
      sessionId: session.id,
      url: session.url,
      testMode: false,
    };
  } catch (error) {
    logger.error('Stripe checkout session failed', { error: error.message, bookingId });
    throw error;
  }
}

/**
 * Verify a completed Stripe session
 */
async function verifyCheckoutSession(sessionId) {
  if (!stripe) {
    // Test mode — always return success
    return { paid: true, testMode: true };
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return {
      paid: session.payment_status === 'paid',
      bookingId: session.client_reference_id,
      paymentIntentId: session.payment_intent,
      amountPaid: session.amount_total / 100,
      testMode: false,
    };
  } catch (error) {
    logger.error('Stripe session verification failed', { error: error.message, sessionId });
    throw error;
  }
}

/**
 * Handle Stripe webhook events
 */
function constructWebhookEvent(body, signature) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return null;
  }

  return stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
}

module.exports = {
  stripe,
  isConfigured,
  createCheckoutSession,
  verifyCheckoutSession,
  constructWebhookEvent,
};
