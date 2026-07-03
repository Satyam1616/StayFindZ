/**
 * Register Page — Full signup with role selection
 */
import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';
import './AuthPages.css';

export default function RegisterPage() {
  const { register: registerUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', role: 'guest' },
  });

  const password = watch('password');

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const { confirmPassword, ...userData } = data;
      const user = await registerUser(userData);
      toast.success(`Welcome to StayFinder, ${user.name}!`);
      navigate(user.role === 'host' ? '/dashboard' : '/');
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page" id="register-page">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-header">
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Start exploring amazing stays</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form" id="register-form">
          <div className="input-group">
            <label className="input-label" htmlFor="name">Full Name</label>
            <div className="input-with-icon">
              <FiUser size={18} className="input-icon" />
              <input
                id="name"
                type="text"
                className={`input input-icon-padding ${errors.name ? 'input-error' : ''}`}
                placeholder="John Doe"
                {...register('name', {
                  required: 'Name is required',
                  minLength: { value: 2, message: 'At least 2 characters' },
                })}
              />
            </div>
            {errors.name && <span className="error-text">{errors.name.message}</span>}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="reg-email">Email</label>
            <div className="input-with-icon">
              <FiMail size={18} className="input-icon" />
              <input
                id="reg-email"
                type="email"
                className={`input input-icon-padding ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' },
                })}
              />
            </div>
            {errors.email && <span className="error-text">{errors.email.message}</span>}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="reg-password">Password</label>
            <div className="input-with-icon">
              <FiLock size={18} className="input-icon" />
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                className={`input input-icon-padding ${errors.password ? 'input-error' : ''}`}
                placeholder="Min 8 characters"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'At least 8 characters' },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/,
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
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="confirm-password">Confirm Password</label>
            <div className="input-with-icon">
              <FiLock size={18} className="input-icon" />
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                className={`input input-icon-padding ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Re-enter password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === password || 'Passwords do not match',
                })}
              />
            </div>
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword.message}</span>}
          </div>

          {/* Role Toggle */}
          <div className="input-group">
            <label className="input-label">I want to</label>
            <div className="role-toggle" id="role-toggle">
              <label className={`role-option ${watch('role') === 'guest' ? 'active' : ''}`}>
                <input type="radio" value="guest" {...register('role')} />
                <span className="role-icon">🧳</span>
                <span>Travel</span>
              </label>
              <label className={`role-option ${watch('role') === 'host' ? 'active' : ''}`}>
                <input type="radio" value="host" {...register('role')} />
                <span className="role-icon">🏠</span>
                <span>Host</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg auth-submit"
            disabled={isSubmitting}
            id="register-submit"
          >
            {isSubmitting ? 'Creating account...' : 'Sign up'}
            {!isSubmitting && <FiArrowRight size={18} />}
          </button>
        </form>

        {/* Google Sign-In */}
        <GoogleSignInButton />

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login" className="auth-link">Log in</Link></p>
        </div>
      </motion.div>
    </div>
  );
}
