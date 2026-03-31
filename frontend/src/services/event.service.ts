import api from './api';

/**
 * @desc Get all events from API
 */
export const fetchEvents = async () => {
  try {
    const response = await api.get('/events');
    return response.data.data;
  } catch (error) {
    console.error('Erreur API Evénements:', error);
    throw error;
  }
};

/**
 * @desc Register for an event
 */
export const registerForEvent = async (eventId: string, userData: any) => {
  const response = await api.post(`/events/${eventId}/register`, userData);
  return response.data.data;
};
