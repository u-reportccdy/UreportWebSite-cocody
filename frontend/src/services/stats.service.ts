import api from './api';

export const fetchStats = async () => {
  const response = await api.get('/stats');
  return response.data.data;
};

export const fetchStatsReport = async () => {
  const response = await api.get('/stats/report');
  return response.data.data;
};
