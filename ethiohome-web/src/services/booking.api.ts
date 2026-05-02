import api from './api';

export const bookingApi = {
  create: (data: any) => api.post('/bookings', data),
  getUserBookings: () => api.get('/bookings/my-bookings'),
  getOwnerBookings: () => api.get('/bookings/manage'),
  updateStatus: (id: string, status: string) => api.patch(`/bookings/${id}/status`, { status }),
  cancel: (id: string) => api.post(`/bookings/${id}/cancel`),
};
