'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useStore } from '@/store/useStore';

export default function VideoPlayer({ onBack }: { onBack?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimer = useRef<NodeJS.Timeout | null>(null);
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
    isLive: true,
  });

  // Player başlat
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentChannel?.url) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const url = currentChannel.url;
    
    // Canlı yayın mı kontrol et (.m3u8 = canlı)
    const isLiveStream = url.includes('.m3u8') || url.includes('live') || url.includes('stream');
    setPlayerState(prev => ({ ...prev, isLive: isLiveStream }));

    if (url.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true, maxBufferLength: 30 });
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
        setPlayerState(prev => ({ ...prev, error: 'Yayın açılamadı' }));
      });
    }

    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, [currentChannel?.url]);

  // Video events
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

  // 5 SANİYE SONRA KONTROLLERİ GİZLE
  const resetControlsTimer = () => {
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    setPlayerState(prev => ({ ...prev, showControls: true }));
    
    controlsTimer.current = setTimeout(() => {
      setPlayerState(prev => ({ ...prev, showControls: false }));
    }, 5000);
  };

  // Mouse/dokunma olunca kontrolleri göster
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const showControls = () => resetControlsTimer();
    
    container.addEventListener('mousemove', showControls);
    container.addEventListener('touchstart', showControls);
    container.addEventListener('click', showControls);

    return () => {
      container.removeEventListener('mousemove', showControls);
      container.removeEventListener('touchstart', showControls);
      container.removeEventListener('click', showControls);
    };
  }, []);

  const togglePlay = () => {
    if (videoRef.current) videoRef.current[playerState.isPlaying ? 'pause' : 'play']();
    resetControlsTimer();
  };

  const toggleMute = () => {
    if (videoRef.current) videoRef.current.muted = !playerState.isMuted;
    resetControlsTimer();
  };

  const changeVolume = (v: number) => {
    if (videoRef.current) videoRef.current.volume = Math.max(0, Math.min(1, v));
    resetControlsTimer();
  };

  const toggleFullscreen = () => {
    document.fullscreenElement ? document.exitFullscreen() : containerRef.current?.requestFullscreen();
    resetControlsTimer();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (playerState.isLive || !videoRef.current) return;
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pct * playerState.duration;
    resetControlsTimer();
  };

  const formatTime = (t: number) => {
    if (!isFinite(t) || t < 0) return '0:00';
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = Math.floor(t % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = playerState.duration > 0 ? (playerState.currentTime / playerState.duration) * 100 : 0;

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
      className="relative w-full bg-black overflow-hidden rounded-xl group"
      style={{ aspectRatio: '16/9' }}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        autoPlay
      />

      {/* Hata */}
      {playerState.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
          <div className="text-center">
            <p className="text-gray-300 text-sm mb-3">{playerState.error}</p>
            <button
              onClick={() => {
                if (videoRef.current) { videoRef.current.load(); videoRef.current.play().catch(() => {}); }
              }}
              className="px-5 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      )}

      {/* GERİ TUŞU - Her zaman görünür */}
      {onBack && (
        <div className="absolute top-3 left-3 z-30">
          <button
            onClick={(e) => { e.stopPropagation(); onBack(); }}
            className="px-3 py-1.5 bg-black/50 backdrop-blur rounded-lg text-sm hover:bg-black/70"
          >
            ← Geri
          </button>
        </div>
      )}

      {/* Kanal Adı */}
      {playerState.showControls && (
        <div className="absolute top-3 right-3 z-20">
          <p className="text-xs bg-black/50 backdrop-blur px-3 py-1.5 rounded-lg text-white/80">
            {currentChannel.name}
          </p>
        </div>
      )}

      {/* ALT KONTROLLER - 5 saniye sonra gizlenir */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12 z-20 transition-opacity duration-300 ${
          playerState.showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* İlerleme çubuğu - SADECE FİLM/ADULT (canlı değilse) */}
        {!playerState.isLive && (
          <div className="mb-3 cursor-pointer" onClick={handleSeek}>
            <div className="relative h-1 bg-gray-600/50 rounded-full group">
              <div className="absolute h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100"
                style={{ left: `${progress}%`, marginLeft: -6 }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-400">{formatTime(playerState.currentTime)}</span>
              <span className="text-[10px] text-gray-400">{formatTime(playerState.duration)}</span>
            </div>
          </div>
        )}

        {/* Butonlar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={togglePlay} className="p-2 hover:bg-white/10 rounded-lg text-lg">
              {playerState.isPlaying ? '⏸' : '▶️'}
            </button>
            <button onClick={toggleMute} className="p-2 hover:bg-white/10 rounded-lg">
              {playerState.isMuted || playerState.volume === 0 ? '🔇' : '🔊'}
            </button>
            <input
              type="range" min="0" max="1" step="0.1"
              value={playerState.volume}
              onChange={(e) => changeVolume(parseFloat(e.target.value))}
              className="w-20 h-1 accent-blue-500 hidden sm:block"
            />
          </div>

          <div className="flex items-center space-x-2">
            {!playerState.isLive && (
              <span className="text-xs text-gray-400">
                {formatTime(playerState.currentTime)} / {formatTime(playerState.duration)}
              </span>
            )}
            <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-lg text-lg">
              ⛶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
