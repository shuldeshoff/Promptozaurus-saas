import { create } from 'zustand';
import apiClient from '../lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  language: 'en' | 'ru';
  theme: 'dark' | 'light';
  createdAt: string;
  projectCount?: number;
  projectLimit?: number;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  fetchUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  fetchUser: async () => {
    try {
      const response = await apiClient.get('/auth/me');
      set({
        user: response.data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  updateProfile: async (data) => {
    try {
      const response = await apiClient.patch('/api/user/profile', data);
      set((state) => ({
        user: state.user ? { ...state.user, ...response.data } : null,
      }));
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
      set({
        user: null,
        isAuthenticated: false,
      });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  },
}));

