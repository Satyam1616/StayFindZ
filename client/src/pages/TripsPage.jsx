/**
 * TripsPage — Guest's booking list
 */
import { useQuery } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCalendar, FiMapPin, FiUsers } from 'react-icons/fi';
import { bookingsApi } from '../api/bookings';
import { useAuth } from '../context/AuthContext';
import './TripsPage.css';

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

export default function TripsPage() {
  const { isAuthenticated, loading } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['myBookings'],
    queryFn: () => bookingsApi.getMyBookings().then((res) => res.data.data.bookings),
    enabled: isAuthenticated,
  });

  if (!loading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const formatPrice = (price) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(price);

  return (
    <div className="trips-page container" id="trips-page">
      <motion.h1
        className="trips-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Your Trips
      </motion.h1>

      {isLoading ? (
        <div className="trips-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="trip-card-skeleton">
              <div className="skeleton" style={{ width: '200px', height: '100%', borderRadius: '12px 0 0 12px' }} />
              <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="skeleton" style={{ height: '20px', width: '60%' }} />
                <div className="skeleton" style={{ height: '16px', width: '40%' }} />
                <div className="skeleton" style={{ height: '16px', width: '30%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : data?.length === 0 ? (
        <div className="trips-empty">
          <p className="empty-icon">✈️</p>
          <h3>No trips yet</h3>
          <p>Time to plan your next adventure!</p>
          <Link to="/" className="btn btn-primary">Explore stays</Link>
        </div>
      ) : (
        <div className="trips-grid">
          {data?.map((booking, i) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link to={`/bookings/${booking.id}`} className="trip-card" id={`trip-${booking.id}`}>
                <div className="trip-image">
                  <img src={booking.listing?.images?.[0]} alt={booking.listing?.title} />
                </div>
                <div className="trip-info">
                  <div className="trip-top">
                    <h3 className="trip-listing-title">{booking.listing?.title}</h3>
                    <span className={`badge badge-${booking.status}`}>
                      {STATUS_LABELS[booking.status]}
                    </span>
                  </div>
                  <p className="trip-location">
                    <FiMapPin size={14} /> {booking.listing?.city}, {booking.listing?.country}
                  </p>
                  <div className="trip-details">
                    <span><FiCalendar size={14} /> {formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}</span>
                    <span><FiUsers size={14} /> {booking.guests} guest{booking.guests > 1 ? 's' : ''}</span>
                  </div>
                  <p className="trip-price">{formatPrice(booking.totalPrice)}</p>
                  {booking.status === 'completed' && !booking.review && (
                    <span className="trip-review-badge">Leave a review →</span>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
