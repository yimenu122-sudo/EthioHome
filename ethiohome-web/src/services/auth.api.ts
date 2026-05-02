import api from './api';

export const authApi = {
  login: (credentials: any) => api.post('/auth/login', credentials),
  register: (userData: any) => api.post('/auth/register', userData),
  verifyAccount: (code: string) => api.post('/auth/verify', { code }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: any) => api.post('/auth/reset-password', data),
  getProfile: () => api.get('/auth/profile'),
};
