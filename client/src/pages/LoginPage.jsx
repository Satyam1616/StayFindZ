/**
 * Login Page — Production-ready with one-click demo login
 */
import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';
import './AuthPages.css';

const DEMO_ACCOUNTS = [
  { label: 'Guest', email: 'aarav@guest.com', password: 'Test@1234', icon: '🧳' },
  { label: 'Host', email: 'meera@host.com', password: 'Test@1234', icon: '🏠' },
  { label: 'Admin', email: 'admin@stayfinder.com', password: 'Test@1234', icon: '⚙️' },
];

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '' },
  });

  if (isAuthenticated) return <Navigate to="/" replace />;

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const user = await login(data);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'host' ? '/dashboard' : '/');
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (account, idx) => {
    setDemoLoading(idx);
    try {
      const user = await login({ email: account.email, password: account.password });
      toast.success(`Logged in as ${user.name} (${account.label})`);
      navigate(user.role === 'host' ? '/dashboard' : '/');
    } catch (error) {
      toast.error('Demo login failed. Make sure the server is running.');
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="auth-page" id="login-page">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-header">
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Log in to continue your journey</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form" id="login-form">
          <div className="input-group">
            <label className="input-label" htmlFor="email">Email</label>
            <div className="input-with-icon">
              <FiMail size={18} className="input-icon" />
              <input
                id="email"
                type="email"
                className={`input input-icon-padding ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
                autoComplete="email"
                {...register('email', { required: 'Email is required' })}
              />
            </div>
            {errors.email && <span className="error-text">{errors.email.message}</span>}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">Password</label>
            <div className="input-with-icon">
              <FiLock size={18} className="input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`input input-icon-padding ${errors.password ? 'input-error' : ''}`}
                placeholder="Enter your password"
                autoComplete="current-password"
                {...register('password', { required: 'Password is required' })}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
            {errors.password && <span className="error-text">{errors.password.message}</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg auth-submit"
            disabled={isSubmitting}
            id="login-submit"
          >
            {isSubmitting ? 'Logging in...' : 'Log in'}
            {!isSubmitting && <FiArrowRight size={18} />}
          </button>
        </form>

        {/* Quick Demo Login */}
        <div className="auth-demo">
          <p className="demo-title">Quick Demo Login</p>
          <div className="demo-buttons">
            {DEMO_ACCOUNTS.map((acc, i) => (
              <button
                key={acc.email}
                className="demo-login-btn"
                onClick={() => handleDemoLogin(acc, i)}
                disabled={demoLoading !== null}
                id={`demo-${acc.label.toLowerCase()}`}
              >
                <span className="demo-login-icon">{acc.icon}</span>
                <span className="demo-login-info">
                  <span className="demo-login-role">{acc.label}</span>
                  <span className="demo-login-email">{acc.email}</span>
                </span>
                {demoLoading === i ? (
                  <span className="demo-spinner" />
                ) : (
                  <FiArrowRight size={14} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Google Sign-In */}
        <GoogleSignInButton />

        <div className="auth-footer">
          <p><Link to="/forgot-password" className="auth-link">Forgot your password?</Link></p>
          <p style={{ marginTop: '8px' }}>Don't have an account? <Link to="/register" className="auth-link">Sign up</Link></p>
        </div>
      </motion.div>
    </div>
  );
}
