/**
 * Bookings API functions
 */
import api from './client';

export const bookingsApi = {
  create: (data) => api.post('/bookings', data),
  getById: (id) => api.get(`/bookings/${id}`),
  cancel: (id) => api.patch(`/bookings/${id}/cancel`),
  approve: (id) => api.patch(`/bookings/${id}/approve`),
  reject: (id) => api.patch(`/bookings/${id}/reject`),
  getMyBookings: () => api.get('/bookings/me'),
  getHostBookings: () => api.get('/bookings/hosting/me'),
  getHostStats: () => api.get('/bookings/hosting/stats'),
};
