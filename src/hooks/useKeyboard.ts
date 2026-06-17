'use client';

import { useEffect, useCallback } from 'react';

interface KeyboardConfig {
  onUp?: () => void;
  onDown?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
  onEnter?: () => void;
  onBack?: () => void;
  onPlayPause?: () => void;
  onChannelUp?: () => void;
  onChannelDown?: () => void;
  onVolumeUp?: () => void;
  onVolumeDown?: () => void;
  onMute?: () => void;
  enabled?: boolean;
}

export function useKeyboard(config: KeyboardConfig) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (config.enabled === false) return;

    // Input elementlerinde klavye kontrollerini engelle
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      return;
    }

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        config.onUp?.();
        break;
      case 'ArrowDown':
        event.preventDefault();
        config.onDown?.();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        config.onLeft?.();
        break;
      case 'ArrowRight':
        event.preventDefault();
        config.onRight?.();
        break;
      case 'Enter':
        event.preventDefault();
        config.onEnter?.();
        break;
      case 'Backspace':
      case 'Escape':
        event.preventDefault();
        config.onBack?.();
        break;
      case ' ':
      case 'k':
        event.preventDefault();
        config.onPlayPause?.();
        break;
      case 'PageUp':
        event.preventDefault();
        config.onChannelUp?.();
        break;
      case 'PageDown':
        event.preventDefault();
        config.onChannelDown?.();
        break;
      case '+':
      case '=':
        event.preventDefault();
        config.onVolumeUp?.();
        break;
      case '-':
        event.preventDefault();
        config.onVolumeDown?.();
        break;
      case 'm':
      case 'M':
        event.preventDefault();
        config.onMute?.();
        break;
    }
  }, [config]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
