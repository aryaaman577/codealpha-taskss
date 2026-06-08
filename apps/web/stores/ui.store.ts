import { create } from 'zustand';

interface UIStore {
  sidebarOpen: boolean;
  activeTab: string;
  theme: 'dark' | 'light';
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setActiveTab: (tab: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  activeTab: 'dashboard',
  theme: 'dark',
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setTheme: (theme) => set({ theme }),
}));
