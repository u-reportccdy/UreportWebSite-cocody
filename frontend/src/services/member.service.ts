import api from './api';

export const createMember = async (memberData: any) => {
  const response = await api.post('/members', memberData);
  return response.data.data;
};

export const loginMember = async (credentials: { full_name: string; phone: string }) => {
  const response = await api.post('/members/login', credentials);
  return response.data.data;
};

export const logoutMember = async () => {
  await api.post('/members/logout');
};

export const fetchMembers = async (query = '') => {
  const response = await api.get('/members', { params: query ? { q: query } : undefined });
  return response.data.data;
};

export const updateMemberStatus = async (memberId: string, status: string) => {
  const response = await api.patch(`/members/${memberId}/status`, { status });
  const payload = response.data.data;
  return Array.isArray(payload) ? payload[0] : payload;
};

export const fetchMemberActivities = async (memberId: string) => {
  const response = await api.get(`/members/${memberId}/activities`);
  return response.data.data;
};

export const updateMember = async (memberId: string, memberData: {
  full_name: string;
  phone: string;
  email: string;
  sex: 'homme' | 'femme' | 'non_precise';
  birth_date: string | null;
  commune: string;
  status: 'aspirant' | 'ureporter' | 'mentor';
}) => {
  const response = await api.patch(`/members/${memberId}`, memberData);
  const payload = response.data.data;
  return Array.isArray(payload) ? payload[0] : payload;
};
