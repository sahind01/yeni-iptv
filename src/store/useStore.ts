'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Channel, PlayerState } from '@/types';

interface AppState {
  isAuthenticated: boolean;
  isAuthReady: boolean;
  userId: string | null;
  username: string | null;
  site: string | null;
  password: string | null;
  sessionToken: string | null;
  
  channels: Channel[];
  filteredChannels: Channel[];
  currentChannel: Channel | null;
  
  sidebarOpen: boolean;
  searchQuery: string;
  activeCategory: string;
  isLoading: boolean;
  
  adultVerified: boolean;
  pinLockedUntil: number | null;
  
  playerState: PlayerState;
  
  login: (userId: string, username: string, site: string, password: string) => void;
  logout: () => void;
  setAuthReady: (ready: boolean) => void;
  setChannels: (channels: Channel[]) => void;
  setCurrentChannel: (channel: Channel | null) => void;
  setFilteredChannels: (channels: Channel[]) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setActiveCategory: (category: string) => void;
  setLoading: (loading: boolean) => void;
  setAdultVerified: (verified: boolean) => void;
  setPinLockedUntil: (timestamp: number | null) => void;
  updatePlayerState: (state: Partial<PlayerState>) => void;
  resetPlayerState: () => void;
}

const initialPlayerState: PlayerState = {
  isPlaying: false,
  isMuted: false,
  volume: 1,
  currentTime: 0,
  duration: 0,
  bufferHealth: 0,
  quality: 'auto',
  isFullscreen: false,
  isPiP: false,
  error: null,
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      isAuthReady: true, // Başlangıçta true, auth kontrolü bitti demek
      userId: null,
      username: null,
      site: null,
      password: null,
      sessionToken: null,
      
      channels: [],
      filteredChannels: [],
      currentChannel: null,
      
      sidebarOpen: false,
      searchQuery: '',
      activeCategory: 'all',
      isLoading: false,
      
      adultVerified: false,
      pinLockedUntil: null,
      
      playerState: { ...initialPlayerState },
      
      login: (userId, username, site, password) => set({
        isAuthenticated: true,
        isAuthReady: true,
        userId,
        username,
        site,
        password,
      }),
      
      logout: () => set({
        isAuthenticated: false,
        isAuthReady: true,
        userId: null,
        username: null,
        site: null,
        password: null,
        channels: [],
        filteredChannels: [],
        currentChannel: null,
        adultVerified: false,
      }),
      
      setAuthReady: (ready) => set({ isAuthReady: ready }),
      setChannels: (channels) => set({ channels, filteredChannels: channels }),
      setCurrentChannel: (channel) => set({ currentChannel: channel }),
      setFilteredChannels: (channels) => set({ filteredChannels: channels }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setActiveCategory: (category) => set({ activeCategory: category }),
      setLoading: (loading) => set({ isLoading: loading }),
      setAdultVerified: (verified) => set({ adultVerified: verified }),
      setPinLockedUntil: (timestamp) => set({ pinLockedUntil: timestamp }),
      updatePlayerState: (newState) => set((state) => ({
        playerState: { ...state.playerState, ...newState }
      })),
      resetPlayerState: () => set({ playerState: { ...initialPlayerState } }),
    }),
    {
      name: 'mutlu-player-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        isAuthReady: state.isAuthReady,
        userId: state.userId,
        username: state.username,
        site: state.site,
        password: state.password,
      }),
    }
  )
);
