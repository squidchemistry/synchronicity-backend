import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginData, RegisterData } from '@/types';
import api from '@/utils/api';
import socketService from '@/utils/socket';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  checkAuth: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      // Actions
      login: async (data: LoginData) => {
        try {
          set({ isLoading: true });
          
          const response = await api.post('/auth/login', data);
          const { token, user } = response.data;

          // Store token in localStorage
          localStorage.setItem('token', token);

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          // Connect to socket
          socketService.connect(token);

          toast.success('Welcome back!');
        } catch (error: any) {
          set({ isLoading: false });
          const message = error.response?.data?.error || 'Login failed';
          toast.error(message);
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        try {
          set({ isLoading: true });
          
          const response = await api.post('/auth/register', data);
          const { token, user } = response.data;

          // Store token in localStorage
          localStorage.setItem('token', token);

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          // Connect to socket
          socketService.connect(token);

          toast.success('Account created successfully!');
        } catch (error: any) {
          set({ isLoading: false });
          const message = error.response?.data?.error || 'Registration failed';
          toast.error(message);
          throw error;
        }
      },

      logout: () => {
        // Clear token from localStorage
        localStorage.removeItem('token');

        // Disconnect socket
        socketService.disconnect();

        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });

        toast.success('Logged out successfully');
      },

      updateProfile: async (data: Partial<User>) => {
        try {
          set({ isLoading: true });
          
          const response = await api.put('/auth/profile', data);
          const { user } = response.data;

          set({
            user,
            isLoading: false,
          });

          toast.success('Profile updated successfully');
        } catch (error: any) {
          set({ isLoading: false });
          const message = error.response?.data?.error || 'Failed to update profile';
          toast.error(message);
          throw error;
        }
      },

      setUser: (user: User) => {
        set({ user });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      checkAuth: async () => {
        try {
          const token = localStorage.getItem('token');
          
          if (!token) {
            set({ isAuthenticated: false });
            return;
          }

          set({ isLoading: true });
          
          const response = await api.get('/auth/me');
          const { user } = response.data;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          // Connect to socket
          socketService.connect(token);
        } catch (error) {
          // Token is invalid
          localStorage.removeItem('token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);