import api from './api';

export const initiateContribution = async (contributionData: any) => {
  const response = await api.post('/contributions/initiate', contributionData);
  return response.data.data;
};

export const fetchContributions = async () => {
  const response = await api.get('/contributions');
  return response.data.data;
};

export const confirmContribution = async (contributionId: string, providerReference = '') => {
  const response = await api.patch(`/contributions/${contributionId}/confirm`, {
    providerReference,
  });
  return response.data.data;
};

export const fetchPaymentLinks = async () => {
  const response = await api.get('/contributions/payment-links');
  return response.data.data;
};

export const createPaymentLink = async (paymentLinkData: any) => {
  const response = await api.post('/contributions/payment-links', paymentLinkData);
  return response.data.data;
};

export const updatePaymentLink = async (paymentLinkId: string, paymentLinkData: any) => {
  const response = await api.patch(`/contributions/payment-links/${paymentLinkId}`, paymentLinkData);
  return response.data.data;
};

export const deletePaymentLink = async (paymentLinkId: string) => {
  await api.delete(`/contributions/payment-links/${paymentLinkId}`);
};
