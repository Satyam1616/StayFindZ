/**
 * ForgotPasswordPage — Request a password reset link
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { FiMail, FiArrowLeft, FiSend, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../api/client';
import './AuthPages.css';

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '' },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/forgot-password', data);
      setSent(true);
      // In dev mode, the API returns the reset URL for testing
      if (res.data.dev?.resetUrl) {
        setDevResetUrl(res.data.dev.resetUrl);
      }
      toast.success('Reset link sent!');
    } catch (error) {
      const message = error.response?.data?.message || 'Something went wrong.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="auth-page" id="forgot-password-page">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="auth-header">
            <div className="success-icon-lg"><FiCheckCircle size={48} /></div>
            <h1 className="auth-title">Check your email</h1>
            <p className="auth-subtitle">
              If an account exists with that email, we've sent a password reset link.
              Check your inbox (and spam folder).
            </p>
          </div>

          {/* Dev mode — show reset link for testing */}
          {devResetUrl && (
            <div className="auth-demo">
              <p className="demo-title">Dev Mode — Reset Link</p>
              <a
                href={devResetUrl}
                className="dev-reset-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                Click here to reset password →
              </a>
              <p className="demo-password" style={{ marginTop: '8px' }}>
                (This link is only shown in development mode)
              </p>
            </div>
          )}

          <div className="auth-footer" style={{ marginTop: 'var(--space-8)' }}>
            <Link to="/login" className="auth-link">
              <FiArrowLeft size={14} /> Back to login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="auth-page" id="forgot-password-page">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-header">
          <h1 className="auth-title">Forgot password?</h1>
          <p className="auth-subtitle">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="input-group">
            <label className="input-label" htmlFor="email">Email address</label>
            <div className="input-with-icon">
              <FiMail size={18} className="input-icon" />
              <input
                id="email"
                type="email"
                className={`input input-icon-padding ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
                autoComplete="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address' },
                })}
              />
            </div>
            {errors.email && <span className="error-text">{errors.email.message}</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg auth-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send reset link'}
            {!isSubmitting && <FiSend size={16} />}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="auth-link">
            <FiArrowLeft size={14} /> Back to login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
