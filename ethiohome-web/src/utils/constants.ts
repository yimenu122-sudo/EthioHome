export const APP_NAME = 'EthioHome';

export const API_ENDPOINTS = {
  AUTH: '/auth',
  PROPERTIES: '/properties',
  BOOKINGS: '/bookings',
  PAYMENTS: '/payments',
  ADMIN: '/admin',
};

export const STORAGE_KEYS = {
  TOKEN: 'ethiohome_token',
  USER: 'ethiohome_user',
  LANGUAGE: 'ethiohome_lang',
  THEME: 'ethiohome_theme',
};

export const ROLES = {
  RENTER: 'renter',
  BUYER: 'buyer',
  OWNER: 'owner',
  AGENT: 'agent',
  ADMIN: 'admin',
} as const;

export const PROPERTY_TYPES = {
  RENT: 'rent',
  SALE: 'sale',
} as const;

export const CITIES = [
  'Addis Ababa',
  'Adama',
  'Bahir Dar',
  'Dire Dawa',
  'Hawassa',
  'Mekelle',
  'Gondar',
  'Jimma',
  'Dessie',
  'Shashemene',
];
