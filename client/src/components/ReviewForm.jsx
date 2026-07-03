/**
 * ReviewForm — Submit a review for a completed booking
 */
import { useState } from 'react';
import { FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { reviewsApi } from '../api/reviews';

export default function ReviewForm({ bookingId, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating < 1) {
      toast.error('Please select a rating');
      return;
    }
    if (comment.trim().length < 10) {
      toast.error('Review must be at least 10 characters');
      return;
    }

    setSubmitting(true);
    try {
      await reviewsApi.create({ bookingId, rating, comment: comment.trim() });
      toast.success('Review submitted!');
      onSuccess?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="review-form" onSubmit={handleSubmit} id="review-form">
      <h4>Leave a review</h4>
      <p className="review-form-hint">Share your experience with other guests</p>

      <div className="review-stars-input">
        {Array.from({ length: 5 }).map((_, i) => {
          const value = i + 1;
          return (
            <button
              key={value}
              type="button"
              className={`star-btn ${value <= (hoverRating || rating) ? 'active' : ''}`}
              onMouseEnter={() => setHoverRating(value)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(value)}
              aria-label={`${value} stars`}
            >
              <FiStar size={28} />
            </button>
          );
        })}
      </div>

      <textarea
        className="input input-textarea"
        rows={4}
        placeholder="Tell others about your stay..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        required
        minLength={10}
      />

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
