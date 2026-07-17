import axios from 'axios';

// In production, all API calls go through Vercel's proxy (/api → tweaki.pw/agadi/api)
// This avoids CORS entirely. In dev, hit localhost directly.
const BASE_URL = import.meta.env.DEV
  ? (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080/api')
  : '/api';

const API = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
API.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null;

    if (userInfo && userInfo.token) {
      config.headers.Authorization = `Bearer ${userInfo.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle session expiration / invalid token (401 Unauthorized)
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('userInfo');
      window.dispatchEvent(new Event('auth-logout'));
    }
    return Promise.reject(error);
  }
);

export default API;
