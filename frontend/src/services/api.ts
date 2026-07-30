import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur de requête : injecter automatiquement le token Bearer
api.interceptors.request.use(
  (config) => {
    // Déterminer s'il s'agit d'une requête admin ou membre pour utiliser le bon token
    const isAdminRoute = String(config.url || '').startsWith('/admin') || String(config.url || '').startsWith('/superadmin') || String(config.url || '').includes('/auth/');
    
    let token = '';
    if (isAdminRoute) {
      token = localStorage.getItem('admin_access_token') || '';
    } else {
      token = localStorage.getItem('member_access_token') || localStorage.getItem('admin_access_token') || '';
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Variable pour éviter les appels de rafraîchissement multiples en parallèle
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

// Intercepteur de réponse : rafraîchissement automatique de token en cas d'erreur 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;
    const url = String(originalRequest?.url || '');
    
    // Ignorer les requêtes d'authentification et de rafraîchissement elles-mêmes
    const isAuthRoute = url.includes('/auth/admin/login') || 
                        url.includes('/auth/superadmin/login') || 
                        url.includes('/auth/portal/login') ||
                        url.includes('/auth/token/refresh') ||
                        url.includes('/members/login');

    if (status === 401 && !isAuthRoute && !originalRequest._retry) {
      if (isRefreshing) {
        // Enfiler la requête en attente du nouveau token
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // Déterminer s'il s'agit d'un admin ou d'un membre
      const isAdminRoute = url.startsWith('/admin') || url.startsWith('/superadmin') || url.includes('/auth/');
      const userType = isAdminRoute ? 'admin' : 'member';
      const refreshTokenKey = isAdminRoute ? 'admin_refresh_token' : 'member_refresh_token';
      const accessTokenKey = isAdminRoute ? 'admin_access_token' : 'member_access_token';
      
      const refreshToken = localStorage.getItem(refreshTokenKey);

      if (refreshToken) {
        try {
          // Appel public de rafraîchissement
          const res = await axios.post('/api/auth/token/refresh', {
            refresh_token: refreshToken,
            user_type: userType,
          }, {
            headers: { 'Content-Type': 'application/json' }
          });

          const { access_token, refresh_token: new_refresh } = res.data?.data || {};
          
          if (access_token) {
            localStorage.setItem(accessTokenKey, access_token);
            if (new_refresh) {
              localStorage.setItem(refreshTokenKey, new_refresh);
            }
            
            api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            
            processQueue(null, access_token);
            return api(originalRequest);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          
          // Déconnexion forcée en cas d'échec du rafraîchissement
          if (isAdminRoute) {
            localStorage.removeItem('admin_access_token');
            localStorage.removeItem('admin_refresh_token');
            sessionStorage.removeItem('admin_role');
            sessionStorage.removeItem('admin_email');
            window.location.href = '/auth/login';
          } else {
            localStorage.removeItem('member_access_token');
            localStorage.removeItem('member_refresh_token');
            window.location.reload();
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // Pas de refresh token, déconnexion immédiate
        if (isAdminRoute) {
          sessionStorage.removeItem('admin_role');
          sessionStorage.removeItem('admin_email');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
