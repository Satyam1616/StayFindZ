/**
 * ListingDetailPage — Full property detail with booking widget
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  FiStar, FiMapPin, FiUsers, FiHome, FiGrid,
  FiWifi, FiDroplet, FiWind, FiCoffee, FiTv,
  FiTruck, FiSun, FiAnchor, FiHeart, FiShare2, FiChevronLeft,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { listingsApi } from '../api/listings';
import { bookingsApi } from '../api/bookings';
import { useAuth } from '../context/AuthContext';
import { formatAmenity } from '../lib/utils';
import './ListingDetailPage.css';

const AMENITY_ICONS = {
  wifi: FiWifi,
  pool: FiDroplet,
  air_conditioning: FiWind,
  kitchen: FiCoffee,
  parking: FiTruck,
  gym: FiSun,
  beach_access: FiAnchor,
  tv: FiTv,
  default: FiGrid,
};

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [booking, setBooking] = useState(false);
  const [showAllImages, setShowAllImages] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsApi.getById(id).then((res) => res.data.data.listing),
  });

  const listing = data;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const diff = new Date(checkOut) - new Date(checkIn);
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const nights = calculateNights();
  const subtotal = listing ? parseFloat(listing.pricePerNight) * nights : 0;
  const total = subtotal;

  const handleBook = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to book');
      navigate('/login');
      return;
    }
    if (!checkIn || !checkOut) {
      toast.error('Please select check-in and check-out dates');
      return;
    }
    if (nights < 1) {
      toast.error('Check-out must be after check-in');
      return;
    }

    setBooking(true);
    try {
      // Step 1: Create the booking
      const { data } = await bookingsApi.create({
        listingId: id,
        checkIn,
        checkOut,
        guests,
      });

      const bookingId = data.data.booking.id;

      // Step 2: Create Stripe Checkout Session
      try {
        const paymentRes = await (await import('../api/client')).default.post('/payments/create-checkout-session', { bookingId });
        const { url, testMode } = paymentRes.data.data;

        if (testMode) {
          // No Stripe keys — go directly to confirmation
          toast.success('Booking request submitted!');
          navigate(`/bookings/${bookingId}`);
        } else {
          // Redirect to Stripe Checkout
          window.location.href = url;
        }
      } catch {
        // Payment service unavailable — still created the booking
        toast.success('Booking request submitted!');
        navigate(`/bookings/${bookingId}`);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Booking failed';
      toast.error(msg);
    } finally {
      setBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="detail-page container">
        <div className="detail-skeleton">
          <div className="skeleton" style={{ height: '460px', borderRadius: '16px' }} />
          <div style={{ display: 'flex', gap: '48px', marginTop: '32px' }}>
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: '32px', width: '70%', marginBottom: '12px' }} />
              <div className="skeleton" style={{ height: '20px', width: '50%', marginBottom: '24px' }} />
              <div className="skeleton" style={{ height: '100px', width: '100%' }} />
            </div>
            <div className="skeleton" style={{ width: '380px', height: '400px', borderRadius: '16px' }} />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="detail-page container">
        <div className="listings-empty">
          <p className="empty-icon">😕</p>
          <h3>Listing not found</h3>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page" id="listing-detail">
      <div className="container">
        {/* Back Button */}
        <button className="detail-back" onClick={() => navigate(-1)}>
          <FiChevronLeft size={20} /> Back
        </button>

        {/* Title Section */}
        <div className="detail-header">
          <h1 className="detail-title">{listing.title}</h1>
          <div className="detail-meta">
            <div className="detail-meta-left">
              {listing.avgRating && (
                <span className="detail-rating">
                  <FiStar size={14} className="star-icon" /> {listing.avgRating}
                  <span className="rating-count"> · {listing.reviewCount} review{listing.reviewCount !== 1 ? 's' : ''}</span>
                </span>
              )}
              <span className="detail-location">
                <FiMapPin size={14} /> {listing.city}, {listing.country}
              </span>
            </div>
            <div className="detail-actions">
              <button className="btn btn-ghost btn-sm"><FiShare2 size={16} /> Share</button>
              <button className="btn btn-ghost btn-sm"><FiHeart size={16} /> Save</button>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <motion.div
          className="detail-gallery"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="gallery-grid">
            <div className="gallery-main">
              <img src={listing.images[0]} alt={listing.title} className="gallery-image" />
            </div>
            <div className="gallery-side">
              {listing.images.slice(1, 5).map((img, i) => (
                <div key={i} className="gallery-thumb">
                  <img src={img} alt={`${listing.title} ${i + 2}`} className="gallery-image" />
                </div>
              ))}
            </div>
          </div>
          {listing.images.length > 5 && (
            <button className="gallery-show-all btn btn-secondary btn-sm" onClick={() => setShowAllImages(true)}>
              Show all {listing.images.length} photos
            </button>
          )}
        </motion.div>

        {/* Content + Booking Widget */}
        <div className="detail-content">
          {/* Left — Details */}
          <div className="detail-info">
            {/* Host + Property Type */}
            <div className="detail-host-bar">
              <div>
                <h2 className="detail-type-title">
                  {listing.type?.replace('_', ' ')} hosted by {listing.host?.name}
                </h2>
                <p className="detail-specs">
                  {listing.maxGuests} guest{listing.maxGuests !== 1 ? 's' : ''} · {listing.bedrooms} bedroom{listing.bedrooms !== 1 ? 's' : ''} · {listing.bathrooms} bathroom{listing.bathrooms !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="host-avatar-lg">
                {listing.host?.avatarUrl ? (
                  <img src={listing.host.avatarUrl} alt={listing.host.name} />
                ) : (
                  <FiUsers size={24} />
                )}
              </div>
            </div>

            <div className="detail-divider" />

            {/* Highlights */}
            <div className="detail-highlights">
              <div className="highlight-item">
                <FiHome size={24} />
                <div>
                  <h4>Entire {listing.type?.replace('_', ' ')}</h4>
                  <p>You'll have the space all to yourself.</p>
                </div>
              </div>
              <div className="highlight-item">
                <FiMapPin size={24} />
                <div>
                  <h4>Great location</h4>
                  <p>100% of recent guests gave the location a 5-star rating.</p>
                </div>
              </div>
            </div>

            <div className="detail-divider" />

            {/* Description */}
            <div className="detail-description">
              <h3>About this place</h3>
              <p>{listing.description}</p>
            </div>

            <div className="detail-divider" />

            {/* Amenities */}
            <div className="detail-amenities">
              <h3>What this place offers</h3>
              <div className="amenities-grid">
                {listing.amenities?.map((amenity) => {
                  const Icon = AMENITY_ICONS[amenity] || AMENITY_ICONS.default;
                  return (
                    <div key={amenity} className="amenity-item">
                      <Icon size={20} />
                      <span>{formatAmenity(amenity)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="detail-divider" />

            {/* Reviews */}
            {listing.reviews?.length > 0 && (
              <div className="detail-reviews">
                <h3 className="reviews-header">
                  <FiStar size={18} className="star-icon" />
                  {listing.avgRating} · {listing.reviewCount} review{listing.reviewCount !== 1 ? 's' : ''}
                </h3>
                <div className="reviews-grid">
                  {listing.reviews.map((review) => (
                    <div key={review.id} className="review-card">
                      <div className="review-author">
                        <div className="review-avatar">
                          {review.guest?.avatarUrl ? (
                            <img src={review.guest.avatarUrl} alt={review.guest.name} />
                          ) : (
                            <FiUsers size={16} />
                          )}
                        </div>
                        <div>
                          <p className="review-name">{review.guest?.name}</p>
                          <p className="review-date">
                            {new Date(review.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="review-stars">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <FiStar
                            key={i}
                            size={12}
                            className={i < review.rating ? 'star-filled' : 'star-empty'}
                          />
                        ))}
                      </div>
                      <p className="review-comment">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — Booking Widget */}
          <div className="booking-widget-container">
            <div className="booking-widget" id="booking-widget">
              <div className="widget-price">
                <span className="widget-price-amount">{formatPrice(listing.pricePerNight)}</span>
                <span className="widget-price-unit"> night</span>
              </div>

              {listing.avgRating && (
                <div className="widget-rating">
                  <FiStar size={12} className="star-icon" /> {listing.avgRating}
                  <span> · {listing.reviewCount} review{listing.reviewCount !== 1 ? 's' : ''}</span>
                </div>
              )}

              <div className="widget-dates">
                <div className="widget-date-field">
                  <label>CHECK-IN</label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    id="checkin-input"
                  />
                </div>
                <div className="widget-date-field">
                  <label>CHECKOUT</label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    min={checkIn || new Date().toISOString().split('T')[0]}
                    id="checkout-input"
                  />
                </div>
              </div>

              <div className="widget-guests-field">
                <label>GUESTS</label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  id="guests-select"
                >
                  {Array.from({ length: listing.maxGuests }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} guest{i > 0 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="btn btn-primary btn-lg widget-reserve-btn"
                onClick={handleBook}
                disabled={booking}
                id="reserve-btn"
              >
                {booking ? 'Booking...' : 'Reserve'}
              </button>

              {nights > 0 && (
                <div className="widget-breakdown">
                  <div className="breakdown-row">
                    <span>{formatPrice(listing.pricePerNight)} × {nights} night{nights > 1 ? 's' : ''}</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="breakdown-total">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full-screen image modal */}
      {showAllImages && (
        <div className="image-modal" onClick={() => setShowAllImages(false)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="image-modal-close" onClick={() => setShowAllImages(false)}>✕</button>
            <div className="image-modal-grid">
              {listing.images.map((img, i) => (
                <img key={i} src={img} alt={`${listing.title} ${i + 1}`} className="modal-image" />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
