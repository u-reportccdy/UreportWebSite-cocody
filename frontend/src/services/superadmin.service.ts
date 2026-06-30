import api from './api';

export const fetchSuperadminDashboard = async () => {
  const response = await api.get('/superadmin/dashboard');
  return response.data.data;
};

export const fetchAdmins = async () => {
  const response = await api.get('/superadmin/admins');
  return response.data.data;
};

export const createAdminAccount = async (payload: { email: string; password: string; role?: string }) => {
  const response = await api.post('/superadmin/admins', payload);
  return response.data.data;
};

export const updateAdminAccount = async (
  adminId: string,
  payload: { email?: string; active?: boolean; new_password?: string; role?: string }
) => {
  const response = await api.patch(`/superadmin/admins/${adminId}`, payload);
  return response.data.data;
};

export const resetSecurityCodes = async (payload: { admin_password?: string; superadmin_password?: string }) => {
  const response = await api.post('/superadmin/codes/reset', payload);
  return response.data.data;
};

export const fetchSuperadminLogs = async () => {
  const response = await api.get('/superadmin/logs');
  return response.data.data;
};

export const deleteAdminAccount = async (adminId: string) => {
  const response = await api.delete(`/superadmin/admins/${adminId}`);
  return response.data.data;
};
