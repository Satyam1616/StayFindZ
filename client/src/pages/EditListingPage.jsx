/**
 * EditListingPage — Edit an existing listing
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiSave, FiX, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { listingsApi } from '../api/listings';
import { useAuth } from '../context/AuthContext';
import { AMENITIES_LIST, LISTING_TYPES, normalizeAmenity, formatAmenity } from '../lib/utils';
import './CreateListingPage.css';

export default function EditListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isHost, user, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [imageUrls, setImageUrls] = useState(['']);

  const { data: listing, isLoading, isError } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsApi.getById(id).then((res) => res.data.data.listing),
    enabled: isAuthenticated && isHost,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (listing) {
      reset({
        title: listing.title,
        description: listing.description,
        type: listing.type,
        address: listing.address,
        city: listing.city,
        country: listing.country,
        pricePerNight: listing.pricePerNight,
        maxGuests: listing.maxGuests,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
      });
      setSelectedAmenities(
        (listing.amenities || []).map((a) => formatAmenity(a))
      );
      setImageUrls(listing.images?.length ? listing.images : ['']);
    }
  }, [listing, reset]);

  if (!authLoading && (!isAuthenticated || !isHost)) {
    return <Navigate to="/" replace />;
  }

  if (!isLoading && (isError || !listing)) {
    return (
      <div className="create-listing-page container">
        <div className="listings-empty">
          <h3>Listing not found</h3>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  if (listing && listing.host?.id !== user?.id && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const toggleAmenity = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        pricePerNight: Number(formData.pricePerNight),
        maxGuests: Number(formData.maxGuests),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        amenities: selectedAmenities.map(normalizeAmenity),
        images: imageUrls.filter((url) => url.trim()),
      };
      await listingsApi.update(id, payload);
      toast.success('Listing updated!');
      navigate(`/listings/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="create-listing-page container">
        <div className="skeleton" style={{ height: '400px', borderRadius: '12px' }} />
      </div>
    );
  }

  return (
    <div className="create-listing-page" id="edit-listing-page">
      <div className="create-container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="step-title" style={{ marginBottom: 'var(--space-6)' }}>Edit Listing</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="step-content">
            <div className="form-grid">
              <div className="input-group full-width">
                <label className="input-label">Property Type</label>
                <select className="input" {...register('type')}>
                  {LISTING_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="input-group full-width">
                <label className="input-label">Title *</label>
                <input type="text" className={`input ${errors.title ? 'input-error' : ''}`}
                  {...register('title', { required: 'Title is required', minLength: { value: 5, message: 'At least 5 characters' } })} />
                {errors.title && <span className="error-text">{errors.title.message}</span>}
              </div>

              <div className="input-group full-width">
                <label className="input-label">Description *</label>
                <textarea className="input input-textarea" rows={4}
                  {...register('description', { required: 'Description is required', minLength: { value: 20, message: 'At least 20 characters' } })} />
                {errors.description && <span className="error-text">{errors.description.message}</span>}
              </div>

              <div className="input-group full-width">
                <label className="input-label">Address *</label>
                <input type="text" className="input" {...register('address', { required: true })} />
              </div>

              <div className="input-group">
                <label className="input-label">City *</label>
                <input type="text" className="input" {...register('city', { required: true })} />
              </div>

              <div className="input-group">
                <label className="input-label">Country</label>
                <input type="text" className="input" {...register('country')} />
              </div>

              <div className="input-group">
                <label className="input-label">Price per Night (₹) *</label>
                <input type="number" className="input" min="100" {...register('pricePerNight', { required: true, min: 100 })} />
              </div>

              <div className="input-group">
                <label className="input-label">Max Guests</label>
                <input type="number" className="input" min="1" {...register('maxGuests')} />
              </div>

              <div className="input-group">
                <label className="input-label">Bedrooms</label>
                <input type="number" className="input" min="0" {...register('bedrooms')} />
              </div>

              <div className="input-group">
                <label className="input-label">Bathrooms</label>
                <input type="number" className="input" min="0" {...register('bathrooms')} />
              </div>
            </div>

            <h3 style={{ margin: 'var(--space-6) 0 var(--space-3)' }}>Amenities</h3>
            <div className="amenities-grid">
              {AMENITIES_LIST.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  className={`amenity-chip ${selectedAmenities.includes(amenity) ? 'selected' : ''}`}
                  onClick={() => toggleAmenity(amenity)}
                >
                  {amenity}
                </button>
              ))}
            </div>

            <h3 style={{ margin: 'var(--space-6) 0 var(--space-3)' }}>Images</h3>
            <div className="image-urls-list">
              {imageUrls.map((url, index) => (
                <div key={index} className="image-url-row">
                  <span className="image-url-number">{index + 1}</span>
                  <input
                    type="url"
                    className="input"
                    placeholder="https://images.unsplash.com/..."
                    value={url}
                    onChange={(e) => setImageUrls((prev) => prev.map((u, i) => (i === index ? e.target.value : u)))}
                  />
                  {imageUrls.length > 1 && (
                    <button type="button" className="image-url-remove" onClick={() => setImageUrls((prev) => prev.filter((_, i) => i !== index))}>
                      <FiX size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-secondary btn-sm add-image-btn" onClick={() => setImageUrls((prev) => [...prev, ''])}>
                <FiPlus size={14} /> Add image
              </button>
            </div>

            <div className="create-nav" style={{ marginTop: 'var(--space-8)' }}>
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/dashboard')}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting}>
                <FiSave size={18} /> {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
