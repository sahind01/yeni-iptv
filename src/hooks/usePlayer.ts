'use client';

import { useRef, useCallback, useEffect } from 'react';
import Hls from 'hls.js';
import { useStore } from '@/store/useStore';
import { RECONNECT_MAX_ATTEMPTS, RECONNECT_BASE_DELAY } from '@/utils/constants';

export function usePlayer() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  
  const { currentChannel, playerState, updatePlayerState, resetPlayerState } = useStore();

  // HLS.js ile oynatıcıyı başlat
  const initPlayer = useCallback((url: string, autoPlay: boolean = true) => {
    if (!videoRef.current) return;

    // Önceki instance'ı temizle
    destroyPlayer();

    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 4,
        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 4,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 6,
      });

      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) {
          video.play().catch(console.error);
        }
        reconnectAttempts.current = 0;
        updatePlayerState({ error: null });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              handleReconnect(hls, url);
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              updatePlayerState({ 
                error: 'Yayın geçici olarak kullanılamıyor' 
              });
              destroyPlayer();
              break;
          }
        }
      });

      hls.on(Hls.Events.BUFFER_APPENDED, () => {
        const buffered = video.buffered;
        if (buffered.length > 0) {
          const bufferEnd = buffered.end(buffered.length - 1);
          const duration = video.duration;
          const health = duration > 0 ? bufferEnd / duration : 0;
          updatePlayerState({ bufferHealth: Math.min(health, 1) });
        }
      });

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      if (autoPlay) {
        video.play().catch(console.error);
      }
    } else {
      updatePlayerState({ error: 'Tarayıcınız HLS oynatmayı desteklemiyor' });
    }
  }, []);

  // Yeniden bağlanma
  const handleReconnect = useCallback((hls: Hls, url: string) => {
    if (reconnectAttempts.current < RECONNECT_MAX_ATTEMPTS) {
      const delay = RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttempts.current);
      
      updatePlayerState({ 
        error: `Bağlantı kesildi. Yeniden bağlanılıyor... (${reconnectAttempts.current + 1}/${RECONNECT_MAX_ATTEMPTS})` 
      });
      
      reconnectTimer.current = setTimeout(() => {
        hls.loadSource(url);
        reconnectAttempts.current++;
      }, delay);
    } else {
      updatePlayerState({ 
        error: 'Yayın geçici olarak kullanılamıyor' 
      });
      destroyPlayer();
    }
  }, []);

  // Oynatıcıyı temizle
  const destroyPlayer = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    reconnectAttempts.current = 0;
    if (videoRef.current) {
      videoRef.current.src = '';
      videoRef.current.load();
    }
  }, []);

  // Oynat/Durdur
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (playerState.isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      updatePlayerState({ isPlaying: !playerState.isPlaying });
    }
  }, [playerState.isPlaying]);

  // Ses aç/kapat
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !playerState.isMuted;
      updatePlayerState({ isMuted: !playerState.isMuted });
    }
  }, [playerState.isMuted]);

  // Ses seviyesi
  const setVolume = useCallback((volume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = Math.max(0, Math.min(1, volume));
      updatePlayerState({ volume });
    }
  }, []);

  // Tam ekran
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await videoRef.current?.requestFullscreen();
      updatePlayerState({ isFullscreen: true });
    } else {
      await document.exitFullscreen();
      updatePlayerState({ isFullscreen: false });
    }
  }, []);

  // Picture in Picture
  const togglePiP = useCallback(async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        updatePlayerState({ isPiP: false });
      } else {
        await videoRef.current?.requestPictureInPicture();
        updatePlayerState({ isPiP: true });
      }
    } catch (error) {
      console.error('PiP hatası:', error);
    }
  }, []);

  // İleri/geri sarma
  const seek = useCallback((seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  }, []);

  // Kalite değiştirme
  const setQuality = useCallback((level: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
      updatePlayerState({ 
        quality: level === -1 ? 'auto' : `${hlsRef.current.levels[level]?.height}p` 
      });
    }
  }, []);

  // Mevcut kanal değiştiğinde oynatıcıyı güncelle
  useEffect(() => {
    if (currentChannel?.url) {
      initPlayer(currentChannel.url);
    } else {
      destroyPlayer();
    }

    return () => {
      destroyPlayer();
    };
  }, [currentChannel?.url]);

  // Time update
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      updatePlayerState({ 
        currentTime: video.currentTime,
        duration: video.duration 
      });
    };

    const handlePlay = () => updatePlayerState({ isPlaying: true });
    const handlePause = () => updatePlayerState({ isPlaying: false });
    const handleEnded = () => updatePlayerState({ isPlaying: false });

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  return {
    videoRef,
    playerState,
    initPlayer,
    destroyPlayer,
    togglePlay,
    toggleMute,
    setVolume,
    toggleFullscreen,
    togglePiP,
    seek,
    setQuality,
  };
}
