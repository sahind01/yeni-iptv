export const CATEGORIES = [
  { id: 'all', name: 'Tümü', icon: '📺' },
  { id: 'turkiye', name: 'Türkiye', icon: '🇹🇷' },
  { id: 'spor', name: 'Spor', icon: '⚽' },
  { id: 'belgesel', name: 'Belgesel', icon: '🌍' },
  { id: 'cocuk', name: 'Çocuk', icon: '🧒' },
  { id: 'haber', name: 'Haber', icon: '📰' },
  { id: 'film', name: 'Film', icon: '🎬' },
  { id: 'muzik', name: 'Müzik', icon: '🎵' },
  { id: 'yabanci', name: 'Yabancı', icon: '🌐' },
  { id: 'adult', name: 'Adult', icon: '🔞' },
];

export const QUALITY_OPTIONS = [
  { value: 'auto', label: 'Otomatik' },
  { value: '1080p', label: '1080p FHD' },
  { value: '720p', label: '720p HD' },
  { value: '480p', label: '480p SD' },
  { value: '360p', label: '360p' },
];

export const MAX_RECENT_WATCHES = 20;
export const MAX_PIN_ATTEMPTS = 3;
export const PIN_LOCK_DURATION = 30000; // 30 saniye
export const RECONNECT_MAX_ATTEMPTS = 5;
export const RECONNECT_BASE_DELAY = 2000;

export const STORAGE_KEYS = {
  SESSION: 'mutlu_session',
  SETTINGS: 'mutlu_settings',
  PIN_ATTEMPTS: 'mutlu_pin_attempts',
} as const;
