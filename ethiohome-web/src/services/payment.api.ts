import api from './api';

export const paymentApi = {
  initializePayment: (data: any) => api.post('/payments/initialize', data),
  verifyTransaction: (tx_ref: string) => api.get(`/payments/verify/${tx_ref}`),
  getPaymentHistory: () => api.get('/payments/history'),
  getAgentCommissions: () => api.get('/payments/commissions'),
};
