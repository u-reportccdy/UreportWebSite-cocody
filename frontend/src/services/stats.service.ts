import api from './api';

export const fetchStats = async () => {
  const response = await api.get('/stats');
  return response.data.data;
};
