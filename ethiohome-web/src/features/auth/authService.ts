import axios from 'axios';

const API_URL = 'https://api.ethiohome.com/v1/auth';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'renter' | 'buyer' | 'owner' | 'agent' | 'admin';
  token: string;
}

export const authService = {
  login: async (credentials: any): Promise<User> => {
    // Mock API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: '1',
          name: 'Habesha User',
          email: credentials.email || 'user@ethiohome.com',
          role: 'renter',
          token: 'mock-jwt-token',
        });
      }, 1000);
    });
  },

  register: async (userData: any): Promise<User> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ...userData,
          id: '2',
          token: 'mock-jwt-token',
        });
      }, 1000);
    });
  },

  logout: async () => {
    return Promise.resolve();
  }
};
