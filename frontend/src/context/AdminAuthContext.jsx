import React, { createContext, useState, useEffect } from 'react';
import adminAPI from '../utils/adminApi';

export const AdminAuthContext = createContext();

// Admin session duration: 1 day in milliseconds
const ADMIN_SESSION_DURATION_MS = 1 * 24 * 60 * 60 * 1000;

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('adminInfo');
    const expiresAt = localStorage.getItem('adminSessionExpiry');

    if (stored) {
      if (expiresAt && Date.now() > parseInt(expiresAt, 10)) {
        // Admin session expired (older than 1 day) — auto logout
        localStorage.removeItem('adminInfo');
        localStorage.removeItem('adminSessionExpiry');
      } else {
        setAdmin(JSON.parse(stored));
      }
    }
    setLoading(false);

    const handleAdminLogout = () => setAdmin(null);
    window.addEventListener('admin-logout', handleAdminLogout);
    return () => window.removeEventListener('admin-logout', handleAdminLogout);
  }, []);

  const loginAdmin = async (email, password) => {
    try {
      const { data } = await adminAPI.post('/auth/login', { email, password });
      if (!data.isAdmin) {
        return { success: false, message: 'Access Denied. Only administrators are allowed here.' };
      }
      setAdmin(data);
      localStorage.setItem('adminInfo', JSON.stringify(data));
      // Store admin session expiry: now + 1 day
      localStorage.setItem('adminSessionExpiry', (Date.now() + ADMIN_SESSION_DURATION_MS).toString());
      return { success: true };
    } catch (error) {
      const errMsg = error.response?.data?.message
        || (error.response?.status === 520 || error.response?.status === 500
          ? 'Server or network error (520/500). Please check server status and try again.'
          : 'Login failed. Please check your email and password credentials.');
      return {
        success: false,
        message: errMsg,
      };
    }
  };

  const logoutAdmin = () => {
    localStorage.removeItem('adminInfo');
    localStorage.removeItem('adminSessionExpiry');
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, loginAdmin, logoutAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

