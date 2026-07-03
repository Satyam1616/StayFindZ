/**
 * ProfilePage — User profile settings
 */
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { FiUser, FiPhone, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, isAuthenticated, loading, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      avatarUrl: user?.avatarUrl || '',
    },
    values: {
      name: user?.name || '',
      phone: user?.phone || '',
      avatarUrl: user?.avatarUrl || '',
    },
  });

  if (!loading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await updateProfile({
        name: data.name,
        phone: data.phone || null,
        avatarUrl: data.avatarUrl || null,
      });
      toast.success('Profile updated!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page container" id="profile-page">
      <motion.div
        className="profile-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="profile-title">Profile Settings</h1>
        <p className="profile-subtitle">Manage your account information</p>

        <div className="profile-info-bar">
          <div className="profile-avatar">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} />
            ) : (
              <FiUser size={32} />
            )}
          </div>
          <div>
            <p className="profile-email">{user?.email}</p>
            <span className="profile-role-badge">{user?.role}</span>
          </div>
        </div>

        <form className="profile-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="input-group">
            <label className="input-label"><FiUser size={14} /> Full Name</label>
            <input
              type="text"
              className={`input ${errors.name ? 'input-error' : ''}`}
              {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'At least 2 characters' } })}
            />
            {errors.name && <span className="error-text">{errors.name.message}</span>}
          </div>

          <div className="input-group">
            <label className="input-label"><FiPhone size={14} /> Phone</label>
            <input
              type="tel"
              className="input"
              placeholder="+91-9876543210"
              {...register('phone')}
            />
          </div>

          <div className="input-group">
            <label className="input-label"><FiImage size={14} /> Avatar URL</label>
            <input
              type="url"
              className="input"
              placeholder="https://images.unsplash.com/..."
              {...register('avatarUrl')}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
