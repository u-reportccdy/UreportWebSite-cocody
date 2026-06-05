import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = String(error?.config?.url || '');
    const isAuthRoute = url.includes('/auth/admin/login') || url.includes('/auth/superadmin/login');
    if ((status === 401 || status === 403) && !isAuthRoute) {
      sessionStorage.removeItem('admin_role');
      sessionStorage.removeItem('admin_email');
    }
    return Promise.reject(error);
  },
);

export default api;
