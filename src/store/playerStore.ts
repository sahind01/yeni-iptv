'use client';

import { create } from 'zustand';

interface PlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  bufferHealth: number;
  quality: string;
  qualityLevel: number;
  isFullscreen: boolean;
  isPiP: boolean;
  error: string | null;
  reconnectAttempts: number;

  setIsPlaying: (playing: boolean) => void;
  setIsMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setBufferHealth: (health: number) => void;
  setQuality: (quality: string, level: number) => void;
  setIsFullscreen: (fullscreen: boolean) => void;
  setIsPiP: (pip: boolean) => void;
  setError: (error: string | null) => void;
  setReconnectAttempts: (attempts: number) => void;
  reset: () => void;
}

const initialState = {
  isPlaying: false,
  isMuted: false,
  volume: 1,
  currentTime: 0,
  duration: 0,
  bufferHealth: 0,
  quality: 'auto',
  qualityLevel: -1,
  isFullscreen: false,
  isPiP: false,
  error: null,
  reconnectAttempts: 0,
};

export const usePlayerStore = create<PlayerState>((set) => ({
  ...initialState,

  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setIsMuted: (muted) => set({ isMuted: muted }),
  setVolume: (volume) => set({ volume }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setBufferHealth: (health) => set({ bufferHealth: health }),
  setQuality: (quality, level) => set({ quality, qualityLevel: level }),
  setIsFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),
  setIsPiP: (pip) => set({ isPiP: pip }),
  setError: (error) => set({ error }),
  setReconnectAttempts: (attempts) => set({ reconnectAttempts: attempts }),
  reset: () => set(initialState),
}));
