/**
 * Shared client utilities
 */

export function normalizeAmenity(label) {
  return label.toLowerCase().replace(/\s+/g, '_');
}

export function formatAmenity(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export const AMENITIES_LIST = [
  'WiFi', 'Air conditioning', 'Heating', 'Kitchen', 'Washer', 'Dryer',
  'Free parking', 'Pool', 'Hot tub', 'TV', 'Workspace', 'Gym',
  'Breakfast', 'Smoke alarm', 'First aid', 'Fire extinguisher',
  'Iron', 'Hair dryer', 'Coffee maker', 'Balcony',
];

export const LISTING_TYPES = [
  { value: 'entire_place', label: 'Entire Place', icon: '🏠', desc: 'Guests have the whole place' },
  { value: 'private_room', label: 'Private Room', icon: '🛏️', desc: 'Guests have their own room' },
  { value: 'shared_room', label: 'Shared Room', icon: '🛋️', desc: 'Guests share a room' },
];

export function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(date, options = {}) {
  return new Date(date).toLocaleDateString('en-IN', options);
}
