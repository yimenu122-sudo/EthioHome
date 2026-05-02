import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'renter' | 'buyer' | 'owner' | 'agent' | 'admin';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        localStorage.setItem('ethiohome_token', token);
        set({ user, token, isAuthenticated: true });
      },
      clearAuth: () => {
        localStorage.removeItem('ethiohome_token');
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'ethiohome-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
