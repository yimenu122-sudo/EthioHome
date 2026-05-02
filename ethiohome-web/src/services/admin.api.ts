import api from './api';

export const adminApi = {
  getSystemStats: () => api.get('/admin/stats'),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  updateUserStatus: (id: string, active: boolean) => api.patch(`/admin/users/${id}/status`, { active }),
  getDisputes: () => api.get('/admin/disputes'),
  resolveDispute: (id: string, resolution: any) => api.post(`/admin/disputes/${id}/resolve`, resolution),
  getAuditLogs: () => api.get('/admin/audit-logs'),
};
