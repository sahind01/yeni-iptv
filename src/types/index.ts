// Kullanıcı tipleri
export interface User {
  id: string;
  username: string;
  password: string;
  site: string;
  adultPin?: string;
  settings: UserSettings;
  createdAt: number;
  lastLogin: number;
}

export interface UserSettings {
  theme: 'dark' | 'light';
  autoPlay: boolean;
  preferredQuality: 'auto' | '1080p' | '720p' | '480p' | '360p';
  language: 'tr' | 'en';
  bufferSize: number;
}

// Kanal tipleri
export interface Channel {
  id: string;
  name: string;
  logo: string;
  url: string;
  group: string;
  quality: 'SD' | 'HD' | 'FHD' | '4K';
  epg?: EPGData;
  tvgId?: string;
  tvgName?: string;
}

export interface EPGData {
  current: {
    title: string;
    start: string;
    end: string;
    description?: string;
    category?: string;
  };
  next?: {
    title: string;
    start: string;
    end: string;
  };
}

export interface Favorite {
  id?: string;
  userId: string;
  channelId: string;
  channel: Channel;
  addedAt: number;
}

export interface RecentWatch {
  id?: string;
  userId: string;
  channel: Channel;
  watchedAt: number;
  duration?: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  channelCount: number;
}

export interface PinAttempt {
  count: number;
  lastAttempt: number;
  lockedUntil: number;
}

export interface M3UResponse {
  success: boolean;
  data?: string;
  error?: string;
}

// Player state tipi
export interface PlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  bufferHealth: number;
  quality: string;
  isFullscreen: boolean;
  isPiP: boolean;
  error: string | null;
}
