import React, { createContext, useState, useEffect } from 'react';
import API from '../utils/api';

export const AuthContext = createContext();

// This context manages ONLY public customer sessions (stored in 'userInfo').
// Admin sessions are managed separately by AdminAuthContext ('adminInfo').
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('userInfo');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Safety: if somehow an admin token ended up in userInfo, clear it
      if (parsed.isAdmin) {
        localStorage.removeItem('userInfo');
      } else {
        setUser(parsed);
      }
    }
    setLoading(false);

    const handleUserLogout = () => setUser(null);
    window.addEventListener('auth-logout', handleUserLogout);
    return () => window.removeEventListener('auth-logout', handleUserLogout);
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await API.post('/auth/login', { email, password });
      // Block admin accounts from logging in via the public customer login
      if (data.isAdmin) {
        return { success: false, message: 'Admin accounts must use the Admin Portal to log in.' };
      }
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please check your credentials.',
      };
    }
  };

  const register = async (name, email, phone, password, confirmPassword) => {
    try {
      const { data } = await API.post('/auth/register', {
        name, email, phone, password, confirmPassword,
      });
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Signup failed. Please try again.',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
