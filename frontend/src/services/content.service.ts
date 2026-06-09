import api from './api';

export const fetchPartners = async () => {
  const response = await api.get('/partners');
  return response.data.data;
};

export const fetchTestimonials = async () => {
  const response = await api.get('/testimonials');
  return response.data.data;
};

export const fetchGalleryAlbums = async () => {
  const response = await api.get('/gallery/albums');
  return response.data.data;
};

export const fetchGalleryPhotos = async () => {
  const response = await api.get('/gallery/photos');
  return response.data.data;
};

export const createPartner = async (partnerData: any) => {
  const response = await api.post('/partners', partnerData);
  return response.data.data;
};

export const updatePartner = async (partnerId: string, partnerData: any) => {
  const response = await api.patch(`/partners/${partnerId}`, partnerData);
  return response.data.data;
};

export const deletePartner = async (partnerId: string) => {
  await api.delete(`/partners/${partnerId}`);
};

export const fetchNewsletterSubscribers = async () => {
  const response = await api.get('/newsletter/subscribers');
  return response.data.data;
};

export const subscribeNewsletter = async (payload: any) => {
  const response = await api.post('/newsletter/subscribe', payload);
  return response.data.data;
};

export const createTestimonial = async (testimonialData: any) => {
  const response = await api.post('/testimonials', testimonialData);
  return response.data.data;
};

export const updateTestimonial = async (testimonialId: string, testimonialData: any) => {
  const response = await api.patch(`/testimonials/${testimonialId}`, testimonialData);
  return response.data.data;
};

export const deleteTestimonial = async (testimonialId: string) => {
  await api.delete(`/testimonials/${testimonialId}`);
};

export const createGalleryAlbum = async (albumData: any) => {
  const response = await api.post('/gallery/albums', albumData);
  return response.data.data;
};

export const updateGalleryAlbum = async (albumId: string, albumData: any) => {
  const response = await api.patch(`/gallery/albums/${albumId}`, albumData);
  return response.data.data;
};

export const deleteGalleryAlbum = async (albumId: string) => {
  await api.delete(`/gallery/albums/${albumId}`);
};

export const fetchGalleryPhotosForAlbum = async (albumId: string) => {
  const response = await api.get('/gallery/photos');
  const allPhotos = response.data.data || [];
  return allPhotos.filter((photo: any) => photo.album_id === albumId);
};

export const createGalleryPhoto = async (photoData: any) => {
  const response = await api.post('/gallery/photos', photoData);
  return response.data.data;
};

export const deleteGalleryPhoto = async (photoId: string) => {
  await api.delete(`/gallery/photos/${photoId}`);
};

export const fetchSiteSettings = async () => {
  const response = await api.get('/settings');
  return response.data.data;
};

export const updateSiteSettings = async (settingsData: any) => {
  const response = await api.patch('/settings', settingsData);
  return response.data.data;
};

export const changeAdminCredentials = async (payload: {
  target_role: 'admin' | 'superadmin';
  target_email: string;
  current_password?: string;
  new_password?: string;
}) => {
  const response = await api.post('/auth/admin/change-credentials', payload);
  return response.data.data;
};

export const fetchTeamMembers = async () => {
  const response = await api.get('/team-members');
  return response.data.data;
};

export const createTeamMember = async (payload: any) => {
  const response = await api.post('/team-members', payload);
  return response.data.data;
};

export const updateTeamMember = async (memberId: string, payload: any) => {
  const response = await api.patch(`/team-members/${memberId}`, payload);
  return response.data.data;
};

export const deleteTeamMember = async (memberId: string) => {
  await api.delete(`/team-members/${memberId}`);
};
