import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);

  // Load user info on mount if token exists
  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setUser({ ...res.user, profile: res.profile });
          } else {
            handleLogoutClean();
          }
        } catch (err) {
          console.warn('Session check failed:', err.message);
          handleLogoutClean();
        }
      }
      setLoading(false);
    }

    loadUser();

    function onExpired() {
      handleLogoutClean();
    }
    window.addEventListener('auth-session-expired', onExpired);
    return () => window.removeEventListener('auth-session-expired', onExpired);
  }, [token]);

  function handleLogoutClean() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  }

  // 1. Initiate Login (Step 1)
  async function login(email, password) {
    const res = await api.login({ email, password });
    return res; // contains { requires2FA: true, tempToken, userId, demoOtp }
  }

  // 2. Complete 2FA Verification (Step 2)
  async function complete2FA(tempToken, otp) {
    const res = await api.verify2FA({ tempToken, otp });
    if (res.success && res.token) {
      localStorage.setItem('auth_token', res.token);
      localStorage.setItem('auth_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  }

  // 3. Register Student Account
  async function register(formData) {
    return await api.register(formData);
  }

  // 4. Verify University Email
  async function verifyEmail(userId, otp) {
    return await api.verifyEmail({ userId, otp });
  }

  // 5. Logout
  async function logout() {
    try {
      if (token) {
        await api.logout();
      }
    } catch (e) {
      // Ignore network error on logout
    } finally {
      handleLogoutClean();
    }
  }

  // 6. Refresh profile data
  async function refreshUser() {
    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser({ ...res.user, profile: res.profile });
      }
    } catch (e) {
      console.warn('Refresh user failed:', e.message);
    }
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    isAdmin: Boolean(user && user.role === 'admin'),
    login,
    complete2FA,
    register,
    verifyEmail,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
