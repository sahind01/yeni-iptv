'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  isAuthReady: boolean;
  userId: string | null;
  username: string | null;
  site: string | null;
  sessionToken: string | null;
  lastActivity: number;

  setAuth: (data: {
    userId: string;
    username: string;
    site: string;
    sessionToken: string;
  }) => void;
  
  clearAuth: () => void;
  setAuthReady: (ready: boolean) => void;
  updateActivity: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isAuthReady: false,
      userId: null,
      username: null,
      site: null,
      sessionToken: null,
      lastActivity: Date.now(),

      setAuth: (data) => set({
        isAuthenticated: true,
        userId: data.userId,
        username: data.username,
        site: data.site,
        sessionToken: data.sessionToken,
        lastActivity: Date.now(),
      }),

      clearAuth: () => set({
        isAuthenticated: false,
        userId: null,
        username: null,
        site: null,
        sessionToken: null,
        lastActivity: 0,
      }),

      setAuthReady: (ready) => set({ isAuthReady: ready }),
      updateActivity: () => set({ lastActivity: Date.now() }),
    }),
    {
      name: 'mutlu-auth-store',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        userId: state.userId,
        username: state.username,
        site: state.site,
        sessionToken: state.sessionToken,
      }),
    }
  )
);
