import axios from 'axios';

// On utilise une URL de base centralisée
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('admin_token');
  const url = config.url || '';
  const isAuthLoginEndpoint = url.includes('/auth/admin/login') || url.includes('/auth/superadmin/login');
  if (token && !isAuthLoginEndpoint) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

