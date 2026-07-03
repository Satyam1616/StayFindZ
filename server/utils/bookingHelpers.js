/**
 * Mark past confirmed bookings as completed when checkout has passed.
 */
async function ensureBookingCompleted(prisma, booking) {
  if (!booking || booking.status !== 'confirmed') return booking;

  const checkOut = new Date(booking.checkOut);
  if (checkOut >= new Date()) return booking;

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: 'completed' },
  });

  return { ...booking, status: 'completed' };
}

function isReviewEligible(booking) {
  if (!booking) return false;
  if (booking.status === 'completed') return true;
  if (booking.status === 'confirmed' && new Date(booking.checkOut) < new Date()) {
    return true;
  }
  return false;
}

module.exports = { ensureBookingCompleted, isReviewEligible };
