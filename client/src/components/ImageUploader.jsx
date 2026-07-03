/**
 * ImageUploader — Drag-and-drop multi-image upload component
 * Uploads to /api/v1/uploads/listings and returns URLs
 */
import { useState, useCallback } from 'react';
import { FiUploadCloud, FiX, FiImage, FiLoader } from 'react-icons/fi';
import api from '../api/client';
import './ImageUploader.css';

export default function ImageUploader({ images = [], onChange, maxFiles = 10 }) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);

  const handleUpload = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    const remaining = maxFiles - images.length;
    if (remaining <= 0) {
      setError(`Maximum ${maxFiles} images allowed.`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);

    // Validate file types
    const invalid = filesToUpload.find(f => !f.type.startsWith('image/'));
    if (invalid) {
      setError('Only image files (JPG, PNG, WebP) are allowed.');
      return;
    }

    // Validate file sizes (5MB max)
    const tooLarge = filesToUpload.find(f => f.size > 5 * 1024 * 1024);
    if (tooLarge) {
      setError('Each image must be under 5MB.');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      filesToUpload.forEach(file => formData.append('images', file));

      const res = await api.post('/uploads/listings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newUrls = res.data.data.urls;
      onChange([...images, ...newUrls]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed. Please try again.';
      setError(msg);
    } finally {
      setUploading(false);
    }
  }, [images, maxFiles, onChange]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    handleUpload(e.dataTransfer.files);
  }, [handleUpload]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const handleFileInput = (e) => {
    handleUpload(e.target.files);
    e.target.value = ''; // Reset input
  };

  const removeImage = (index) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  const setCoverPhoto = (index) => {
    if (index === 0) return;
    const updated = [...images];
    const [moved] = updated.splice(index, 1);
    updated.unshift(moved);
    onChange(updated);
  };

  return (
    <div className="image-uploader" id="image-uploader">
      {/* Image Grid */}
      {images.length > 0 && (
        <div className="upload-preview-grid">
          {images.map((url, i) => (
            <div key={`${url}-${i}`} className={`upload-preview-item ${i === 0 ? 'cover' : ''}`}>
              <img src={url} alt={`Upload ${i + 1}`} />
              {i === 0 && <span className="cover-badge">Cover</span>}
              <div className="preview-actions">
                {i !== 0 && (
                  <button
                    type="button"
                    className="preview-action-btn"
                    onClick={() => setCoverPhoto(i)}
                    title="Set as cover photo"
                  >
                    <FiImage size={14} />
                  </button>
                )}
                <button
                  type="button"
                  className="preview-action-btn preview-delete"
                  onClick={() => removeImage(i)}
                  title="Remove"
                >
                  <FiX size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop Zone */}
      {images.length < maxFiles && (
        <div
          className={`upload-dropzone ${dragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !uploading && document.getElementById('image-file-input').click()}
        >
          <input
            id="image-file-input"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
          {uploading ? (
            <>
              <FiLoader size={32} className="upload-spinner" />
              <p className="upload-text">Uploading...</p>
            </>
          ) : (
            <>
              <FiUploadCloud size={32} className="upload-icon" />
              <p className="upload-text">
                <strong>Click to upload</strong> or drag and drop
              </p>
              <p className="upload-hint">
                JPG, PNG or WebP · Max 5MB each · {maxFiles - images.length} remaining
              </p>
            </>
          )}
        </div>
      )}

      {error && <p className="upload-error">{error}</p>}
    </div>
  );
}
