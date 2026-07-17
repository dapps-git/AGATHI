import axios from 'axios';

// In production, all API calls go through Vercel's proxy (/api → tweaki.pw/agadi/api)
// This avoids CORS entirely. In dev, hit localhost directly.
const BASE_URL = import.meta.env.DEV
  ? (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080/api')
  : '/api';

// Separate Axios instance for admin — reads from 'adminInfo', not 'userInfo'
const adminAPI = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach admin JWT from 'adminInfo'
adminAPI.interceptors.request.use(
  (config) => {
    const adminInfo = localStorage.getItem('adminInfo')
      ? JSON.parse(localStorage.getItem('adminInfo'))
      : null;
    if (adminInfo && adminInfo.token) {
      config.headers.Authorization = `Bearer ${adminInfo.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired/invalid admin token (401) → force admin logout
adminAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('adminInfo');
      window.dispatchEvent(new Event('admin-logout'));
      window.location.href = '/admin-login';
    }
    return Promise.reject(error);
  }
);

export default adminAPI;
