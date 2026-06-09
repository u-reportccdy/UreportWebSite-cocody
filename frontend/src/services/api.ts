import axios from 'axios';

// En production comme en développement local, on utilise le chemin relatif '/api'
// pour passer par le proxy (Vite en local / Vercel en production).
// Cela garantit que les requêtes soient "same-origin" et évite le blocage des cookies tiers par les navigateurs.
const api = axios.create({
  baseURL: '/api',
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
