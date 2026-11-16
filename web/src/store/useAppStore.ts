import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
}

interface AppState {
  theme: 'dark' | 'light';
  user: User | null;
  setTheme: (theme: AppState['theme']) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
}

// Estado global de la app. Lo marcado en "partialize" se guarda en localStorage.
export const useAppStore = create<AppState>()(
  persist(
    set => ({
      theme: 'dark' as const,
      user: null,
      setTheme: (theme: AppState['theme']) => set({ theme }),
      setUser: (user: User | null) => set({ user }),
      logout: () => set({ user: null }),
    }),
    { name: 'declaria-store', partialize: (s: AppState) => ({ theme: s.theme }) }
  )
);
