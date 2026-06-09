import api from './api';

// --- MATERIALS SERVICES ---
export const fetchMaterials = async () => {
  const response = await api.get('/materials');
  return response.data.data;
};

export const createMaterial = async (data: any) => {
  const response = await api.post('/materials', data);
  return response.data.data;
};

export const updateMaterial = async (id: string, data: any) => {
  const response = await api.patch(`/materials/${id}`, data);
  return response.data.data;
};

export const deleteMaterial = async (id: string) => {
  await api.delete(`/materials/${id}`);
};

// --- LOGISTICS REQUESTS SERVICES ---
export const fetchLogisticsRequests = async () => {
  const response = await api.get('/logistics/requests');
  return response.data.data;
};

export const createLogisticsRequest = async (data: any) => {
  const response = await api.post('/logistics/requests', data);
  return response.data.data;
};

export const updateLogisticsRequest = async (id: string, data: any) => {
  const response = await api.patch(`/logistics/requests/${id}`, data);
  return response.data.data;
};

export const deleteLogisticsRequest = async (id: string) => {
  await api.delete(`/logistics/requests/${id}`);
};
