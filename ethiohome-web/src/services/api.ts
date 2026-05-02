import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.ethiohome.com/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    // Add Auth Token
    const token = localStorage.getItem('ethiohome_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add Language Header for localized error messages from backend
    const lang = localStorage.getItem('i18nextLng') || 'en';
    config.headers['Accept-Language'] = lang;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if we're already on an auth page to avoid loops/confusion
      const isAuthPage = window.location.pathname.startsWith('/auth/');
      
      localStorage.removeItem('ethiohome_token');
      
      if (!isAuthPage) {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export default api;
