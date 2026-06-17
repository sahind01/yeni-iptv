'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Channel, PlayerState } from '@/types';

interface AppState {
  // Auth
  isAuthenticated: boolean;
  isAuthReady: boolean;
  userId: string | null;
  username: string | null;
  site: string | null;
  
  // Session
  sessionToken: string | null;
  
  // Channels
  channels: Channel[];
  filteredChannels: Channel[];
  currentChannel: Channel | null;
  
  // UI State
  sidebarOpen: boolean;
  searchQuery: string;
  activeCategory: string;
  isLoading: boolean;
  
  // Adult
  adultVerified: boolean;
  pinLockedUntil: number | null;
  
  // Player
  playerState: PlayerState;
  
  // Actions - Auth
  login: (userId: string, username: string, site: string) => void;
  logout: () => void;
  setSessionToken: (token: string | null) => void;
  setAuthReady: (ready: boolean) => void;
  
  // Actions - Channels
  setChannels: (channels: Channel[]) => void;
  setCurrentChannel: (channel: Channel | null) => void;
  setFilteredChannels: (channels: Channel[]) => void;
  
  // Actions - UI
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setActiveCategory: (category: string) => void;
  setLoading: (loading: boolean) => void;
  
  // Actions - Adult
  setAdultVerified: (verified: boolean) => void;
  setPinLockedUntil: (timestamp: number | null) => void;
  
  // Actions - Player
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
    (set, get) => ({
      // Initial Auth State
      isAuthenticated: false,
      isAuthReady: false,
      userId: null,
      username: null,
      site: null,
      sessionToken: null,
      
      // Initial Channel State
      channels: [],
      filteredChannels: [],
      currentChannel: null,
      
      // Initial UI State
      sidebarOpen: false,
      searchQuery: '',
      activeCategory: 'all',
      isLoading: false,
      
      // Initial Adult State
      adultVerified: false,
      pinLockedUntil: null,
      
      // Initial Player State
      playerState: { ...initialPlayerState },
      
      // Auth Actions
      login: (userId, username, site) => set({
        isAuthenticated: true,
        isAuthReady: true,
        userId,
        username,
        site,
      }),
      
      logout: () => set({
        isAuthenticated: false,
        isAuthReady: true,
        userId: null,
        username: null,
        site: null,
        sessionToken: null,
        channels: [],
        currentChannel: null,
        adultVerified: false,
      }),
      
      setSessionToken: (token) => set({ sessionToken: token }),
      setAuthReady: (ready) => set({ isAuthReady: ready }),
      
      // Channel Actions
      setChannels: (channels) => set({ channels }),
      
      setCurrentChannel: (channel) => {
        set({ currentChannel: channel });
        if (channel) {
          set({ playerState: { ...initialPlayerState } });
        }
      },
      
      setFilteredChannels: (channels) => set({ filteredChannels: channels }),
      
      // UI Actions
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setActiveCategory: (category) => set({ activeCategory: category }),
      setLoading: (loading) => set({ isLoading: loading }),
      
      // Adult Actions
      setAdultVerified: (verified) => set({ adultVerified: verified }),
      setPinLockedUntil: (timestamp) => set({ pinLockedUntil: timestamp }),
      
      // Player Actions
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
        userId: state.userId,
        username: state.username,
        site: state.site,
        sessionToken: state.sessionToken,
        activeCategory: state.activeCategory,
      }),
    }
  )
);
