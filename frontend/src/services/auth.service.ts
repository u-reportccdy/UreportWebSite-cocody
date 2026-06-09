import api from './api';

export const logoutAdmin = async () => {
  await api.post('/auth/admin/logout');
};
