'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useStore } from '@/store/useStore';

export default function VideoPlayer({ onBack }: { onBack?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const retryTimer = useRef<NodeJS.Timeout | null>(null);
  const { currentChannel } = useStore();

  const [playerState, setPlayerState] = useState({
    isPlaying: false,
    isMuted: false,
    volume: 1,
    currentTime: 0,
    duration: 0,
    quality: 'auto',
    error: null as string | null,
    showControls: true,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentChannel?.url) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }

    const url = currentChannel.url;

    if (url.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 30,
      });

      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
        setPlayerState(prev => ({ ...prev, error: null }));
      });

      hls.on(Hls.Events.ERROR, () => {
        video.src = url;
        video.load();
        video.play().catch(() => {});
      });
    } else {
      video.src = url;
      video.load();
      video.play().catch(() => {
        setPlayerState(prev => ({ ...prev, error: 'Yayın açılamadı, tekrar deneniyor...' }));
        retryTimer.current = setTimeout(() => {
          video.load();
          video.play().catch(() => {
            setPlayerState(prev => ({ ...prev, error: 'Yayın geçici olarak kullanılamıyor' }));
          });
        }, 3000);
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (retryTimer.current) {
        clearTimeout(retryTimer.current);
        retryTimer.current = null;
      }
    };
  }, [currentChannel?.url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setPlayerState(prev => ({ ...prev, isPlaying: true, error: null }));
    const onPause = () => setPlayerState(prev => ({ ...prev, isPlaying: false }));
    const onTimeUpdate = () => setPlayerState(prev => ({ ...prev, currentTime: video.currentTime }));
    const onDuration = () => setPlayerState(prev => ({ ...prev, duration: video.duration }));
    const onVolume = () => setPlayerState(prev => ({ ...prev, volume: video.volume, isMuted: video.muted }));
    const onError = () => setPlayerState(prev => ({ ...prev, error: 'Yayın geçici olarak kullanılamıyor' }));
    const onCanPlay = () => setPlayerState(prev => ({ ...prev, error: null }));

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDuration);
    video.addEventListener('volumechange', onVolume);
    video.addEventListener('error', onError);
    video.addEventListener('canplay', onCanPlay);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDuration);
      video.removeEventListener('volumechange', onVolume);
      video.removeEventListener('error', onError);
      video.removeEventListener('canplay', onCanPlay);
    };
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      videoRef.current[playerState.isPlaying ? 'pause' : 'play']();
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !playerState.isMuted;
    }
  };

  const changeVolume = (v: number) => {
    if (videoRef.current) {
      videoRef.current.volume = v;
    }
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current?.requestFullscreen();
    }
  };

  const handleRetry = () => {
    if (videoRef.current && currentChannel?.url) {
      setPlayerState(prev => ({ ...prev, error: null }));
      videoRef.current.src = currentChannel.url;
      videoRef.current.load();
      videoRef.current.play().catch(() => {
        setPlayerState(prev => ({ ...prev, error: 'Yayın geçici olarak kullanılamıyor' }));
      });
    }
  };

  const formatTime = (t: number) => {
    if (!isFinite(t) || t < 0) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!currentChannel) {
    return (
      <div className="flex items-center justify-center h-48 bg-[#111] rounded-xl">
        <p className="text-gray-500">Kanal seçilmedi</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black overflow-hidden rounded-xl"
      style={{ aspectRatio: '16/9' }}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        autoPlay
      />

      {/* GERİ TUŞU HER ZAMAN GÖRÜNÜR */}
      {onBack && (
        <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/70 to-transparent z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBack();
            }}
            className="text-sm hover:text-gray-300 bg-black/30 px-3 py-1.5 rounded-lg backdrop-blur"
          >
            ← Geri
          </button>
        </div>
      )}

      {/* Hata - geri tuşunu engellemez */}
      {playerState.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
          <div className="text-center">
            <p className="text-gray-300 text-sm mb-3">{playerState.error}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRetry();
              }}
              className="px-5 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm transition-colors"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      )}

      {/* Kanal adı */}
      <div className="absolute top-12 left-0 p-3 z-10 pointer-events-none">
        <p className="text-xs font-medium text-white/80">{currentChannel.name}</p>
      </div>

      {/* Alt kontroller */}
      <div
        className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <button onClick={togglePlay} className="p-1 text-sm">
            {playerState.isPlaying ? '⏸' : '▶️'}
          </button>
          <button onClick={toggleMute} className="p-1 text-sm">
            {playerState.isMuted ? '🔇' : '🔊'}
          </button>
          <span className="text-xs">
            {formatTime(playerState.currentTime)} / {formatTime(playerState.duration)}
          </span>
          <button onClick={toggleFullscreen} className="p-1 text-sm">
            ⛶
          </button>
        </div>
      </div>
    </div>
  );
}
