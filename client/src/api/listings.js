/**
 * Listings API functions
 */
import api from './client';

export const listingsApi = {
  getAll: (params) => api.get('/listings', { params }),
  getById: (id) => api.get(`/listings/${id}`),
  create: (data) => api.post('/listings', data),
  update: (id, data) => api.patch(`/listings/${id}`, data),
  delete: (id) => api.delete(`/listings/${id}`),
  getAvailability: (id) => api.get(`/listings/${id}/availability`),
  getMyListings: () => api.get('/listings/me/listings'),
};
