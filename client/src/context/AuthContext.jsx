import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser, getMe } from '../services/authApi.js';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('meetingos_user');
    if (!savedUser || savedUser === 'undefined' || savedUser === 'null') return null;
    try {
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('meetingos_token');
    return (savedToken && savedToken !== 'undefined' && savedToken !== 'null') ? savedToken : null;
  });

  const [loading, setLoading] = useState(false);

  // Validate token or sync profile on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('meetingos_token');
      if (storedToken && storedToken !== 'undefined' && storedToken !== 'null') {
        try {
          const res = await getMe();
          const userData = res?.data?.data?.user || res?.data?.user || res?.data?.data;
          if (userData) {
            setUser(userData);
            localStorage.setItem('meetingos_user', JSON.stringify(userData));
          }
        } catch (err) {
          console.warn('Auth token verification failed:', err?.response?.data?.error || err.message);
          if (err?.response?.status === 401) {
            localStorage.removeItem('meetingos_token');
            localStorage.removeItem('meetingos_user');
            setToken(null);
            setUser(null);
          }
        }
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const response = await loginUser({ email, password });
    const payload = response?.data?.data || response?.data || {};
    const receivedToken = payload.token;
    const receivedUser = payload.user;

    if (!receivedToken || !receivedUser) {
      throw new Error('Invalid authentication response from server.');
    }

    localStorage.setItem('meetingos_token', receivedToken);
    localStorage.setItem('meetingos_user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const register = async (name, email, password) => {
    const response = await registerUser({ name, email, password });
    const payload = response?.data?.data || response?.data || {};
    const receivedToken = payload.token;
    const receivedUser = payload.user;

    if (!receivedToken || !receivedUser) {
      throw new Error('Invalid registration response from server.');
    }

    localStorage.setItem('meetingos_token', receivedToken);
    localStorage.setItem('meetingos_user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('meetingos_token');
    localStorage.removeItem('meetingos_user');
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
