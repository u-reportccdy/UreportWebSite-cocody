import api from './api';

export const fetchTasks = async (filters?: { department_code?: string; event_id?: string; status?: string }) => {
  const response = await api.get('/tasks', { params: filters });
  return response.data.data;
};

export const createTask = async (data: any) => {
  const response = await api.post('/tasks', data);
  return response.data.data;
};

export const updateTask = async (id: string, data: any) => {
  const response = await api.patch(`/tasks/${id}`, data);
  return response.data.data;
};

export const deleteTask = async (id: string) => {
  await api.delete(`/tasks/${id}`);
};
