import axios from 'axios';

let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Garantir que l'URL se termine par /api si c'est une URL absolue vers Render
if (API_URL && !API_URL.endsWith('/api') && !API_URL.endsWith('/api/') && API_URL !== '/api') {
  API_URL = API_URL.replace(/\/$/, '') + '/api';
}

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
    const isAuthRoute = url.includes('/auth/admin/login') || url.includes('/auth/superadmin/login') || url.includes('/auth/portal/login');
    if (status === 401 && !isAuthRoute) {
      sessionStorage.removeItem('admin_role');
      sessionStorage.removeItem('admin_email');
    }
    return Promise.reject(error);
  },
);

export default api;
