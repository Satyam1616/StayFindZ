/**
 * ResetPasswordPage — Set new password using reset token
 */
import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { FiLock, FiEye, FiEyeOff, FiArrowRight, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../api/client';
import './AuthPages.css';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { password: '', confirmPassword: '' },
  });

  const password = watch('password');

  // Password strength checker
  const getStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strength = getStrength(password);
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];

  if (!token || !email) {
    return (
      <div className="auth-page" id="reset-password-page">
        <motion.div className="auth-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="auth-header">
            <div className="error-icon-lg"><FiAlertTriangle size={48} /></div>
            <h1 className="auth-title">Invalid reset link</h1>
            <p className="auth-subtitle">
              This password reset link is invalid or has expired.
              Please request a new one.
            </p>
          </div>
          <div className="auth-footer" style={{ marginTop: 'var(--space-6)' }}>
            <Link to="/forgot-password" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              Request new link
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        email,
        password: data.password,
      });
      setSuccess(true);
      toast.success('Password reset successfully!');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reset password.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page" id="reset-password-page">
        <motion.div className="auth-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="auth-header">
            <div className="success-icon-lg"><FiCheckCircle size={48} /></div>
            <h1 className="auth-title">Password reset!</h1>
            <p className="auth-subtitle">
              Your password has been reset successfully. You can now log in with your new password.
            </p>
          </div>
          <button
            className="btn btn-primary btn-lg auth-submit"
            onClick={() => navigate('/login')}
            style={{ marginTop: 'var(--space-6)' }}
          >
            Go to login <FiArrowRight size={18} />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="auth-page" id="reset-password-page">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-header">
          <h1 className="auth-title">Set new password</h1>
          <p className="auth-subtitle">
            Create a new password for <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="input-group">
            <label className="input-label" htmlFor="password">New password</label>
            <div className="input-with-icon">
              <FiLock size={18} className="input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`input input-icon-padding ${errors.password ? 'input-error' : ''}`}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
                    message: 'Must include uppercase, lowercase, number, and special character',
                  },
                })}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
            {errors.password && <span className="error-text">{errors.password.message}</span>}
            {/* Strength indicator */}
            {password && (
              <>
                <div className="password-strength">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`strength-bar ${strength >= level ? 'filled' : ''} ${strength >= 4 ? 'strong' : strength >= 3 ? 'medium' : ''}`}
                    />
                  ))}
                </div>
                <span className="strength-text">{strengthLabels[strength]}</span>
              </>
            )}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="confirmPassword">Confirm password</label>
            <div className="input-with-icon">
              <FiLock size={18} className="input-icon" />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                className={`input input-icon-padding ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === password || 'Passwords do not match',
                })}
              />
            </div>
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword.message}</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg auth-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Resetting...' : 'Reset password'}
            {!isSubmitting && <FiArrowRight size={18} />}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
