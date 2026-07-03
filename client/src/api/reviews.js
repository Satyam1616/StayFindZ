/**
 * Reviews API functions
 */
import api from './client';

export const reviewsApi = {
  create: (data) => api.post('/reviews', data),
  getByListing: (listingId) => api.get(`/reviews/listing/${listingId}`),
};
