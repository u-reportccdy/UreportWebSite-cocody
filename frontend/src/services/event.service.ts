import api from './api';

export const fetchEvents = async () => {
  try {
    const response = await api.get('/events');
    return response.data.data;
  } catch (error) {
    console.error('Erreur API Evénements:', error);
    throw error;
  }
};

export const fetchEvent = async (eventId: string) => {
  const response = await api.get(`/events/${eventId}`);
  return response.data.data;
};

export const createEvent = async (eventData: any) => {
  const response = await api.post('/events', eventData);
  return response.data.data;
};

export const updateEvent = async (eventId: string, eventData: any) => {
  const response = await api.patch(`/events/${eventId}`, eventData);
  return response.data.data;
};

export const deleteEvent = async (eventId: string) => {
  await api.delete(`/events/${eventId}`);
};

export const registerForEvent = async (eventId: string, userData: any) => {
  const response = await api.post(`/events/${eventId}/register`, userData);
  return response.data.data;
};

export const fetchEventRegistrations = async (eventId: string) => {
  const response = await api.get(`/events/${eventId}/registrations`);
  return response.data.data;
};

export const isRegisteredForEvent = async (eventId: string, memberId?: string, phone?: string) => {
  const response = await api.get(`/events/${eventId}/is-registered`, {
    params: {
      member_id: memberId || '',
      phone: phone || '',
    },
  });
  return !!response.data?.data?.registered;
};

export const fetchAttendanceSummary = async (eventId: string) => {
  const response = await api.get(`/events/${eventId}/attendance-summary`);
  return response.data.data;
};

export const markEventAttendance = async (
  eventId: string,
  registrationId: string,
  attended: boolean,
) => {
  const response = await api.patch(`/events/${eventId}/registrations/${registrationId}/attendance`, {
    attended,
  });
  return response.data.data;
};

export const quickCheckIn = async (
  eventId: string,
  payload: {
    phone: string;
    full_name?: string;
    sex?: string;
    birth_date?: string;
    commune?: string;
  }
) => {
  const response = await api.post(`/events/${eventId}/quick-checkin`, payload);
  return response.data.data;
};

