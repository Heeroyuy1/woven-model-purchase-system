import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as licensingApi from '@/services/licensingApi';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  company?: string;
  phone?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadFromStorage: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,

      login: async (email: string, password: string) => {
        const response = await licensingApi.login(email, password) as { token: string; user: User };
        localStorage.setItem('token', response.token);
        set({
          user: response.user,
          token: response.token,
          isAuthenticated: true,
          isAdmin: response.user.role === 'admin',
        });
      },

      logout: () => {
        localStorage.removeItem('token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isAdmin: false,
        });
      },

      loadFromStorage: () => {
        const token = localStorage.getItem('token');
        if (token && get().user) {
          set({ isAuthenticated: true, isAdmin: get().user?.role === 'admin' });
        }
      },

      updateProfile: async (data: Partial<User>) => {
        const response = await licensingApi.updateProfile(data) as User;
        set({ user: { ...get().user!, ...response } });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
      }),
    }
  )
);
