/**
 * Auth Context — Global authentication state
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      authApi.getMe()
        .then(({ data }) => setUser(data.data.user))
        .catch(() => {
          localStorage.removeItem('accessToken');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await authApi.login(credentials);
    localStorage.setItem('accessToken', data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const register = useCallback(async (userData) => {
    const { data } = await authApi.register(userData);
    localStorage.setItem('accessToken', data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Still logout locally even if server call fails
    }
    localStorage.removeItem('accessToken');
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (updates) => {
    const { data } = await authApi.updateMe(updates);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isHost: user?.role === 'host' || user?.role === 'admin',
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
