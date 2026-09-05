import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080/api';
  }
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== '/api') {
    return import.meta.env.VITE_API_URL;
  }
  return 'https://tweaki.pw/agadi/api';
};

const BASE_URL = getBaseUrl();

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
