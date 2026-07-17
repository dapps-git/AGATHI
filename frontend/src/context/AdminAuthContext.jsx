import React, { createContext, useState, useEffect } from 'react';
import adminAPI from '../utils/adminApi';

export const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('adminInfo');
    if (stored) {
      setAdmin(JSON.parse(stored));
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
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please check your credentials.',
      };
    }
  };

  const logoutAdmin = () => {
    localStorage.removeItem('adminInfo');
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, loginAdmin, logoutAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
