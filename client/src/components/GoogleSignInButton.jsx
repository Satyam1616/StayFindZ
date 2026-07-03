/**
 * GoogleSignInButton — Google One Tap / Sign-In button
 * 
 * Uses the Google Identity Services library (GSI) directly.
 * Falls back gracefully when VITE_GOOGLE_CLIENT_ID is not set.
 */
import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleSignInButton({ onSuccess }) {
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const handleCredentialResponse = useCallback(async (response) => {
    try {
      const { data } = await api.post('/auth/google', {
        credential: response.credential,
      });

      // Login via AuthContext
      authLogin(data.data.accessToken, data.data.user);

      toast.success(`Welcome, ${data.data.user.name}!`);

      if (onSuccess) {
        onSuccess(data.data.user);
      } else {
        // Redirect based on role
        if (data.data.user.role === 'host') {
          navigate('/dashboard');
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Google sign-in failed.';
      toast.error(msg);
    }
  }, [authLogin, navigate, onSuccess]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (buttonRef.current) {
          window.google.accounts.id.renderButton(buttonRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            width: '100%',
            logo_alignment: 'left',
          });
        }
      }
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) existingScript.remove();
    };
  }, [handleCredentialResponse]);

  if (!GOOGLE_CLIENT_ID) {
    return null; // Don't render if not configured
  }

  return (
    <div className="google-signin-wrapper">
      <div className="auth-divider">
        <span>or</span>
      </div>
      <div ref={buttonRef} className="google-signin-btn" id="google-signin-btn" />
    </div>
  );
}
