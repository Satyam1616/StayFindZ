/**
 * Admin API functions
 */
import api from './client';

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  getListings: () => api.get('/admin/listings'),
  toggleListing: (id) => api.patch(`/admin/listings/${id}/toggle`),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
};
