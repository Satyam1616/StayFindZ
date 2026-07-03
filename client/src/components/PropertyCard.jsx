/**
 * PropertyCard Component — Listing card for grid display
 * Shows image carousel, location, rating, price
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight, FiStar, FiHeart } from 'react-icons/fi';
import { motion } from 'framer-motion';
import './PropertyCard.css';

export default function PropertyCard({ listing, index = 0 }) {
  const [currentImage, setCurrentImage] = useState(0);
  const [liked, setLiked] = useState(false);

  const images = listing.images || [];
  const hasMultipleImages = images.length > 1;

  const nextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const toggleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked(!liked);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link to={`/listings/${listing.id}`} className="property-card" id={`listing-${listing.id}`}>
        {/* Image Carousel */}
        <div className="card-image-container">
          <div
            className="card-image-slider"
            style={{ transform: `translateX(-${currentImage * 100}%)` }}
          >
            {images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`${listing.title} - ${i + 1}`}
                className="card-image"
                loading="lazy"
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          {hasMultipleImages && (
            <>
              <button className="card-nav card-nav-prev" onClick={prevImage} aria-label="Previous image">
                <FiChevronLeft size={16} />
              </button>
              <button className="card-nav card-nav-next" onClick={nextImage} aria-label="Next image">
                <FiChevronRight size={16} />
              </button>
            </>
          )}

          {/* Dots */}
          {hasMultipleImages && (
            <div className="card-dots">
              {images.slice(0, 5).map((_, i) => (
                <span key={i} className={`card-dot ${i === currentImage ? 'active' : ''}`} />
              ))}
            </div>
          )}

          {/* Like Button */}
          <button
            className={`card-like ${liked ? 'liked' : ''}`}
            onClick={toggleLike}
            aria-label={liked ? 'Unlike' : 'Like'}
          >
            <FiHeart size={18} />
          </button>
        </div>

        {/* Card Info */}
        <div className="card-info">
          <div className="card-info-top">
            <h3 className="card-location">{listing.city}, {listing.country}</h3>
            {listing.avgRating && (
              <div className="card-rating">
                <FiStar size={13} className="star-icon" />
                <span>{listing.avgRating}</span>
              </div>
            )}
          </div>
          <p className="card-title">{listing.title}</p>
          <p className="card-type">
            {listing.type?.replace('_', ' ')} · {listing.bedrooms} bed{listing.bedrooms !== 1 ? 's' : ''} · {listing.maxGuests} guest{listing.maxGuests !== 1 ? 's' : ''}
          </p>
          <p className="card-price">
            <span className="price-amount">{formatPrice(listing.pricePerNight)}</span>
            <span className="price-unit"> night</span>
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
