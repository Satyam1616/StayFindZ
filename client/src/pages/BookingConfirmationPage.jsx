/**
 * BookingConfirmationPage — Booking detail with cancel option
 */
import { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiCalendar, FiMapPin, FiUsers, FiCheckCircle, FiXCircle, FiClock, FiAward } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { bookingsApi } from '../api/bookings';
import { useAuth } from '../context/AuthContext';
import ReviewForm from '../components/ReviewForm';
import './BookingConfirmationPage.css';

const STATUS_CONFIG = {
  pending: { icon: FiClock, color: '#E07912', label: 'Pending', bg: '#FFF3E0' },
  confirmed: { icon: FiCheckCircle, color: '#008A05', label: 'Confirmed', bg: '#E6F7E9' },
  cancelled: { icon: FiXCircle, color: '#C13515', label: 'Cancelled', bg: '#FDECEA' },
  completed: { icon: FiAward, color: '#1976D2', label: 'Completed', bg: '#E8F4FE' },
};

export default function BookingConfirmationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingsApi.getById(id).then((res) => res.data.data.booking),
    enabled: isAuthenticated,
  });

  if (!authLoading && !isAuthenticated) return <Navigate to="/login" replace />;

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await bookingsApi.cancel(id);
      toast.success('Booking cancelled');
      queryClient.invalidateQueries(['booking', id]);
      queryClient.invalidateQueries(['myBookings']);
      setShowCancelModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const formatPrice = (price) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(price);

  if (isLoading) {
    return (
      <div className="confirmation-page container">
        <div className="skeleton" style={{ height: '40px', width: '50%', marginBottom: '24px' }} />
        <div className="skeleton" style={{ height: '400px', borderRadius: '16px' }} />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="confirmation-page container">
        <div className="trips-empty">
          <p className="empty-icon">🔍</p>
          <h3>Booking not found</h3>
          <button className="btn btn-primary" onClick={() => navigate('/trips')}>View all trips</button>
        </div>
      </div>
    );
  }

  const status = STATUS_CONFIG[booking.status];
  const StatusIcon = status.icon;
  const canCancel = ['pending', 'confirmed'].includes(booking.status);
  const canReview = booking.status === 'completed' && !booking.review && booking.guestId === user?.id;

  return (
    <div className="confirmation-page container" id="booking-confirmation">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Status Banner */}
        <div className="status-banner" style={{ background: status.bg }}>
          <StatusIcon size={28} style={{ color: status.color }} />
          <div>
            <h2 style={{ color: status.color }}>{status.label}</h2>
            <p>Booking #{booking.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        <div className="confirmation-grid">
          {/* Booking Details */}
          <div className="confirmation-details">
            <div className="confirmation-listing">
              <img src={booking.listing?.images?.[0]} alt={booking.listing?.title} className="confirmation-image" />
              <div>
                <h3>{booking.listing?.title}</h3>
                <p className="conf-location"><FiMapPin size={14} /> {booking.listing?.city}, {booking.listing?.country}</p>
                <p className="conf-host">Hosted by {booking.listing?.host?.name}</p>
              </div>
            </div>

            <div className="detail-divider" />

            <div className="confirmation-dates">
              <div className="conf-date-block">
                <span className="conf-label">Check-in</span>
                <span className="conf-value">{formatDate(booking.checkIn)}</span>
              </div>
              <div className="conf-date-block">
                <span className="conf-label">Check-out</span>
                <span className="conf-value">{formatDate(booking.checkOut)}</span>
              </div>
              <div className="conf-date-block">
                <span className="conf-label">Guests</span>
                <span className="conf-value">{booking.guests} guest{booking.guests > 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className="detail-divider" />

            <div className="confirmation-price">
              <h4>Price Details</h4>
              <div className="breakdown-total" style={{ borderTop: 'none', paddingTop: 0 }}>
                <span>Total</span>
                <span>{formatPrice(booking.totalPrice)}</span>
              </div>
            </div>

            {canCancel && (
              <>
                <div className="detail-divider" />
                <button
                  className="btn btn-secondary cancel-btn"
                  onClick={() => setShowCancelModal(true)}
                  id="cancel-booking-btn"
                >
                  Cancel Booking
                </button>
              </>
            )}

            {canReview && (
              <>
                <div className="detail-divider" />
                <ReviewForm
                  bookingId={booking.id}
                  onSuccess={() => queryClient.invalidateQueries(['booking', id])}
                />
              </>
            )}

            {booking.review && (
              <>
                <div className="detail-divider" />
                <div className="existing-review">
                  <h4>Your Review</h4>
                  <p className="review-rating-display">{'★'.repeat(booking.review.rating)}{'☆'.repeat(5 - booking.review.rating)}</p>
                  <p>{booking.review.comment}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="cancel-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Cancel this booking?</h3>
            <p>This action cannot be undone. Are you sure you want to cancel your reservation?</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowCancelModal(false)}>Keep Booking</button>
              <button
                className="btn btn-primary"
                onClick={handleCancel}
                disabled={cancelling}
                style={{ background: 'var(--color-error)' }}
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
