import api from './api';

export const propertyApi = {
  getAll: (params?: any) => api.get('/properties', { params }),
  getById: (id: string) => api.get(`/properties/${id}`),
  create: (data: any) => api.post('/properties', data),
  update: (id: string, data: any) => api.put(`/properties/${id}`, data),
  delete: (id: string) => api.delete(`/properties/${id}`),
  uploadImages: (id: string, files: FormData) => 
    api.post(`/properties/${id}/images`, files, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  getFeatured: () => api.get('/properties/featured'),
};
