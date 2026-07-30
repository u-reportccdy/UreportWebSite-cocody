import api from './api';

export const logoutAdmin = async () => {
  try {
    await api.post('/auth/admin/logout');
  } catch (err) {
    console.error('Error during admin logout:', err);
  } finally {
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    sessionStorage.removeItem('admin_role');
    sessionStorage.removeItem('admin_email');
  }
};
