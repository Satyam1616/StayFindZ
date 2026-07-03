/**
 * CreateListingPage — Multi-section form for hosts to create new listings
 */
import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  FiHome, FiMapPin, FiDollarSign, FiImage, FiUsers,
  FiChevronLeft, FiChevronRight, FiCheck, FiPlus, FiX,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { listingsApi } from '../api/listings';
import { useAuth } from '../context/AuthContext';
import { AMENITIES_LIST, LISTING_TYPES, normalizeAmenity } from '../lib/utils';
import ImageUploader from '../components/ImageUploader';
import './CreateListingPage.css';

const STEPS = ['Type', 'Location', 'Details', 'Amenities', 'Images', 'Review'];

export default function CreateListingPage() {
  const { isAuthenticated, isHost, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [manualUrl, setManualUrl] = useState('');

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      type: 'entire_place',
      address: '',
      city: '',
      country: 'India',
      latitude: '0',
      longitude: '0',
      pricePerNight: '',
      maxGuests: 2,
      bedrooms: 1,
      bathrooms: 1,
    },
  });

  if (!loading && (!isAuthenticated || !isHost)) {
    return <Navigate to="/" replace />;
  }

  const watchedValues = watch();

  const toggleAmenity = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const addImageUrl = () => setImageUrls((prev) => [...prev, '']);
  const removeImageUrl = (index) => setImageUrls((prev) => prev.filter((_, i) => i !== index));
  const updateImageUrl = (index, value) => {
    setImageUrls((prev) => prev.map((url, i) => (i === index ? value : url)));
  };

  const canProceed = () => {
    switch (step) {
      case 0: return !!watchedValues.type;
      case 1: return watchedValues.city?.trim() && watchedValues.address?.trim();
      case 2: return watchedValues.title?.trim() && watchedValues.pricePerNight > 0 && watchedValues.description?.trim()?.length >= 20;
      case 3: return true;
      case 4: return imageUrls.length > 0;
      default: return true;
    }
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
        latitude: Number(formData.latitude) || 0,
        longitude: Number(formData.longitude) || 0,
        amenities: selectedAmenities.map(normalizeAmenity),
        images: imageUrls.filter((url) => url.trim()),
      };
      const { data } = await listingsApi.create(payload);
      toast.success('Listing created successfully! 🎉');
      navigate(`/listings/${data.data.listing.id}`);
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to create listing';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-listing-page" id="create-listing-page">
      <div className="create-container">
        {/* Progress Bar */}
        <div className="create-progress">
          {STEPS.map((label, i) => (
            <div key={label} className={`progress-step ${i <= step ? 'active' : ''} ${i < step ? 'completed' : ''}`}>
              <div className="progress-dot">
                {i < step ? <FiCheck size={12} /> : <span>{i + 1}</span>}
              </div>
              <span className="progress-label">{label}</span>
            </div>
          ))}
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
          </div>
        </div>

        {/* Form Steps */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
          className="create-step"
        >
          {/* Step 0: Property Type */}
          {step === 0 && (
            <div className="step-content">
              <h2 className="step-title">What type of place will guests have?</h2>
              <p className="step-subtitle">Choose the option that best describes your place</p>
              <div className="type-options">
                {LISTING_TYPES.map((type) => (
                  <label
                    key={type.value}
                    className={`type-card ${watchedValues.type === type.value ? 'selected' : ''}`}
                    htmlFor={`type-${type.value}`}
                  >
                    <input
                      type="radio"
                      id={`type-${type.value}`}
                      value={type.value}
                      {...register('type')}
                      className="sr-only"
                    />
                    <span className="type-icon">{type.icon}</span>
                    <div className="type-info">
                      <span className="type-label">{type.label}</span>
                      <span className="type-desc">{type.desc}</span>
                    </div>
                    <div className="type-check"><FiCheck size={16} /></div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Location */}
          {step === 1 && (
            <div className="step-content">
              <h2 className="step-title"><FiMapPin className="step-icon" /> Where's your place located?</h2>
              <p className="step-subtitle">Help guests find your property</p>
              <div className="form-grid">
                <div className="input-group full-width">
                  <label className="input-label">Street Address *</label>
                  <input
                    type="text"
                    className={`input ${errors.address ? 'input-error' : ''}`}
                    placeholder="123 Beach Road, Near Fort Aguada"
                    {...register('address', { required: 'Address is required' })}
                  />
                  {errors.address && <span className="error-text">{errors.address.message}</span>}
                </div>
                <div className="input-group">
                  <label className="input-label">City *</label>
                  <input
                    type="text"
                    className={`input ${errors.city ? 'input-error' : ''}`}
                    placeholder="Goa"
                    {...register('city', { required: 'City is required' })}
                  />
                  {errors.city && <span className="error-text">{errors.city.message}</span>}
                </div>
                <div className="input-group">
                  <label className="input-label">Country</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="India"
                    {...register('country')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="step-content">
              <h2 className="step-title"><FiHome className="step-icon" /> Share some details about your place</h2>
              <div className="form-grid">
                <div className="input-group full-width">
                  <label className="input-label">Title *</label>
                  <input
                    type="text"
                    className={`input ${errors.title ? 'input-error' : ''}`}
                    placeholder="Luxury Beachfront Villa with Ocean View"
                    {...register('title', { required: 'Title is required', minLength: { value: 5, message: 'At least 5 characters' } })}
                  />
                  {errors.title && <span className="error-text">{errors.title.message}</span>}
                </div>
                <div className="input-group full-width">
                  <label className="input-label">Description *</label>
                  <textarea
                    className={`input input-textarea ${errors.description ? 'input-error' : ''}`}
                    rows={4}
                    placeholder="Describe what makes your place special (min 20 characters)..."
                    {...register('description', { required: 'Description is required', minLength: { value: 20, message: 'At least 20 characters' } })}
                  />
                  {errors.description && <span className="error-text">{errors.description.message}</span>}
                </div>
                <div className="input-group">
                  <label className="input-label">Price per Night (₹) *</label>
                  <div className="input-with-icon">
                    <FiDollarSign size={18} className="input-icon" />
                    <input
                      type="number"
                      className={`input input-icon-padding ${errors.pricePerNight ? 'input-error' : ''}`}
                      placeholder="2500"
                      min="100"
                      {...register('pricePerNight', { required: 'Price is required', min: { value: 100, message: 'Minimum ₹100' } })}
                    />
                  </div>
                  {errors.pricePerNight && <span className="error-text">{errors.pricePerNight.message}</span>}
                </div>
                <div className="input-group">
                  <label className="input-label">Max Guests</label>
                  <input type="number" className="input" min="1" max="20" {...register('maxGuests')} />
                </div>
                <div className="input-group">
                  <label className="input-label">Bedrooms</label>
                  <input type="number" className="input" min="0" max="20" {...register('bedrooms')} />
                </div>
                <div className="input-group">
                  <label className="input-label">Bathrooms</label>
                  <input type="number" className="input" min="0" max="20" {...register('bathrooms')} />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Amenities */}
          {step === 3 && (
            <div className="step-content">
              <h2 className="step-title">What amenities do you offer?</h2>
              <p className="step-subtitle">Select all that apply — this helps guests find your place</p>
              <div className="amenities-grid">
                {AMENITIES_LIST.map((amenity) => (
                  <button
                    key={amenity}
                    type="button"
                    className={`amenity-chip ${selectedAmenities.includes(amenity) ? 'selected' : ''}`}
                    onClick={() => toggleAmenity(amenity)}
                  >
                    {selectedAmenities.includes(amenity) && <FiCheck size={14} />}
                    {amenity}
                  </button>
                ))}
              </div>
              <p className="amenities-count">{selectedAmenities.length} selected</p>
            </div>
          )}

          {/* Step 4: Images */}
          {step === 4 && (
            <div className="step-content">
              <h2 className="step-title"><FiImage className="step-icon" /> Add photos of your place</h2>
              <p className="step-subtitle">Upload images or paste URLs — the first image will be the cover photo</p>
              
              {/* Drag & Drop Upload */}
              <ImageUploader
                images={imageUrls}
                onChange={setImageUrls}
                maxFiles={10}
              />

              {/* Manual URL Input (fallback) */}
              <div className="manual-url-section">
                <p className="manual-url-label">Or paste an image URL</p>
                <div className="manual-url-row">
                  <input
                    type="url"
                    className="input"
                    placeholder="https://images.unsplash.com/..."
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={!manualUrl.trim()}
                    onClick={() => {
                      if (manualUrl.trim()) {
                        setImageUrls(prev => [...prev, manualUrl.trim()]);
                        setManualUrl('');
                      }
                    }}
                  >
                    <FiPlus size={14} /> Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="step-content">
              <h2 className="step-title"><FiCheck className="step-icon" /> Review your listing</h2>
              <p className="step-subtitle">Make sure everything looks good before publishing</p>
              <div className="review-summary">
                <div className="review-card">
                  <div className="review-section">
                    <h4>Property Type</h4>
                    <p>{LISTING_TYPES.find((t) => t.value === watchedValues.type)?.label}</p>
                  </div>
                  <div className="review-section">
                    <h4>Title</h4>
                    <p>{watchedValues.title || '—'}</p>
                  </div>
                  <div className="review-section">
                    <h4>Location</h4>
                    <p>{watchedValues.address}, {watchedValues.city}, {watchedValues.country}</p>
                  </div>
                  <div className="review-section">
                    <h4>Pricing & Capacity</h4>
                    <p>₹{watchedValues.pricePerNight}/night · {watchedValues.maxGuests} guests · {watchedValues.bedrooms} bed · {watchedValues.bathrooms} bath</p>
                  </div>
                  <div className="review-section">
                    <h4>Amenities</h4>
                    <div className="review-amenities">
                      {selectedAmenities.length > 0
                        ? selectedAmenities.map((a) => <span key={a} className="amenity-tag">{a}</span>)
                        : <p className="text-muted">None selected</p>
                      }
                    </div>
                  </div>
                  <div className="review-section">
                    <h4>Images</h4>
                    <p>{imageUrls.filter((u) => u.trim()).length} photo(s)</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Navigation */}
        <div className="create-nav">
          {step > 0 ? (
            <button type="button" className="btn btn-secondary" onClick={() => setStep((s) => s - 1)}>
              <FiChevronLeft size={18} /> Back
            </button>
          ) : (
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
              Cancel
            </button>
          )}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canProceed()}
              onClick={() => setStep((s) => s + 1)}
            >
              Next <FiChevronRight size={18} />
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-lg"
              disabled={isSubmitting}
              onClick={handleSubmit(onSubmit)}
              id="publish-listing-btn"
            >
              {isSubmitting ? 'Publishing...' : '🎉 Publish Listing'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
