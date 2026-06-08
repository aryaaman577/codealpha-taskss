import { create } from 'zustand';
import { api } from '@/lib/axios';

interface User {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  avatar: string;
  bio?: string;
  customStatus?: string;
  settings?: {
    notifications: {
      email: boolean;
      push: boolean;
      sound: boolean;
      mentions: boolean;
      meetingReminders: boolean;
    };
    privacy: {
      showOnlineStatus: boolean;
      allowDirectMessages: boolean;
      showLastSeen: boolean;
    };
    appearance: {
      theme: 'dark' | 'light' | 'system';
      fontSize: 'small' | 'medium' | 'large';
      compactMode: boolean;
    };
    meeting: {
      defaultCameraOn: boolean;
      defaultMicOn: boolean;
      defaultSpeaker: string;
    };
  };
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { username: string; email: string; password: string; displayName: string }) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  updateUser: (partial: Partial<User>) => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: true }),
  updateUser: (partial) => set((state) => ({ user: state.user ? { ...state.user, ...partial } : null })),

  fetchUser: async () => {
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data.data.user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    set({ user: response.data.data.user, isAuthenticated: true, isLoading: false });
  },

  register: async (data) => {
    await api.post('/auth/register', data);
  },

  logout: async () => {
    await api.post('/auth/logout');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
}));
