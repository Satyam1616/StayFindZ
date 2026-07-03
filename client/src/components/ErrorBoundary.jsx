/**
 * ErrorBoundary Component
 * 
 * Wraps the app to catch unhandled React errors gracefully.
 * Reports errors to Sentry (if configured) and shows a friendly fallback UI.
 */

import { Component } from 'react';
import { Sentry, isConfigured } from '../lib/sentry';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    if (isConfigured) {
      Sentry.captureException(error, {
        extra: { componentStack: errorInfo.componentStack },
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.iconContainer}>
              <svg style={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <circle cx="12" cy="16" r="0.5" fill="currentColor" />
              </svg>
            </div>
            <h1 style={styles.title}>Something went wrong</h1>
            <p style={styles.message}>
              We encountered an unexpected error. Our team has been notified and is working on a fix.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre style={styles.errorDetail}>
                {this.state.error.toString()}
              </pre>
            )}
            <div style={styles.actions}>
              <button style={styles.primaryBtn} onClick={this.handleReset}>
                Try again
              </button>
              <button
                style={styles.secondaryBtn}
                onClick={() => window.location.href = '/'}
              >
                Go home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)',
    padding: '20px',
    fontFamily: "'DM Sans', sans-serif",
  },
  card: {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
    padding: '48px',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
    backdropFilter: 'blur(20px)',
  },
  iconContainer: {
    marginBottom: '24px',
  },
  icon: {
    width: '56px',
    height: '56px',
    color: '#ff6b6b',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '12px',
    letterSpacing: '-0.02em',
  },
  message: {
    fontSize: '15px',
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: '1.6',
    marginBottom: '24px',
  },
  errorDetail: {
    background: 'rgba(255, 107, 107, 0.08)',
    border: '1px solid rgba(255, 107, 107, 0.15)',
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '12px',
    color: '#ff6b6b',
    textAlign: 'left',
    overflowX: 'auto',
    marginBottom: '24px',
    fontFamily: "'Fira Code', monospace",
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  primaryBtn: {
    background: 'linear-gradient(135deg, #FF385C, #e0204c)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 28px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'transform 0.15s ease',
  },
  secondaryBtn: {
    background: 'rgba(255, 255, 255, 0.06)',
    color: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '12px 28px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'transform 0.15s ease',
  },
};

export default ErrorBoundary;
