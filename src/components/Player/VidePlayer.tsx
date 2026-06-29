'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';

export default function VodPlayer({ onBack }: { onBack?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { currentChannel } = useStore();
  
  const [playerState, setPlayerState] = useState({
    isPlaying: false, isMuted: false, volume: 1, currentTime: 0, duration: 0,
    error: null as string | null, showControls: true, isLive: true,
  });

  const [clock, setClock] = useState('');
  const controlsTimer = useRef<NodeJS.Timeout | null>(null);
  const retryCount = useRef(0);

  // Saat
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const id = setInterval(updateClock, 1000);
    return () => clearInterval(id);
  }, []);

  // Kontrolleri otomatik gizle
  const resetControlsTimer = () => {
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    setPlayerState(prev => ({ ...prev, showControls: true }));
    controlsTimer.current = setTimeout(() => {
      setPlayerState(prev => ({ ...prev, showControls: false }));
    }, 5000);
  };

  // Player
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentChannel?.url) return;

    const url = currentChannel.url.trim();
    video.src = url;
    video.load();

    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => {
        setPlayerState(prev => ({ ...prev, error: 'Başlatmak için dokunun ▶️' }));
      });
    }

    return () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [currentChannel?.url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setPlayerState(prev => ({ ...prev, isPlaying: true, error: null }));
    const onPause = () => setPlayerState(prev => ({ ...prev, isPlaying: false }));
    const onTimeUpdate = () => { if (video) setPlayerState(prev => ({ ...prev, currentTime: video.currentTime })); };
    const onDuration = () => { if (video) setPlayerState(prev => ({ ...prev, duration: video.duration })); };
    const onVolume = () => { if (video) setPlayerState(prev => ({ ...prev, volume: video.volume, isMuted: video.muted })); };
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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const show = () => resetControlsTimer();
    container.addEventListener('mousemove', show);
    container.addEventListener('touchstart', show);
    container.addEventListener('click', show);
    return () => {
      container.removeEventListener('mousemove', show);
      container.removeEventListener('touchstart', show);
      container.removeEventListener('click', show);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (playerState.isPlaying) { video.pause(); }
    else { video.play().catch(() => {}); }
    resetControlsTimer();
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !playerState.isMuted;
      resetControlsTimer();
    }
  };

  const toggleFullscreen = () => {
    document.fullscreenElement ? document.exitFullscreen() : containerRef.current?.requestFullscreen();
    resetControlsTimer();
  };

  const seekTime = (s: number) => {
    if (videoRef.current && videoRef.current.duration) {
      videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration, videoRef.current.currentTime + s));
      resetControlsTimer();
    }
  };

  const formatTime = (t: number) => {
    if (!isFinite(t) || t < 0) return '0:00';
    const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = Math.floor(t % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = playerState.duration > 0 ? (playerState.currentTime / playerState.duration) * 100 : 0;
  const isLive = !isFinite(playerState.duration) || playerState.duration === 0;

  if (!currentChannel) {
    return <div className="flex items-center justify-center h-48 bg-[#111] rounded-xl"><p className="text-gray-500">İçerik seçilmedi</p></div>;
  }

  return (
    <div ref={containerRef} className="relative w-full bg-black overflow-hidden rounded-xl group" style={{ aspectRatio: '16/9' }}>
      <video ref={videoRef} className="w-full h-full object-contain" playsInline autoPlay />

      {/* PLAY/PAUSE BUTTON */}
      {!playerState.isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-20 cursor-pointer" onClick={togglePlay}>
          <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/20 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
            <span className="text-4xl">▶️</span>
          </div>
        </div>
      )}

      {/* HATA */}
      {playerState.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <p className="text-white text-sm mb-2">Yayın Yüklenemedi</p>
            <p className="text-gray-400 text-xs mb-4">{playerState.error}</p>
            <button onClick={togglePlay} className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm">Tekrar Dene</button>
          </div>
        </div>
      )}

      {/* OSD - ÜST BAR */}
      <div className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent px-6 pt-5 pb-10 transition-opacity duration-300 ${playerState.showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="text-sm text-white/80 hover:text-white">← Geri</button>
            )}
            <span className="text-sm font-medium text-white">{currentChannel.name}</span>
          </div>
          <span className="text-sm font-light tabular-nums text-white/60">{clock}</span>
        </div>
      </div>

      {/* OSD - ALT KONTROLLER */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-6 pt-12 pb-5 transition-opacity duration-300 ${playerState.showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Seek Bar - sadece VOD */}
        {!isLive && (
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs tabular-nums text-white/70 w-10 text-right">{formatTime(playerState.currentTime)}</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden cursor-pointer"
              onClick={(e) => {
                if (!videoRef.current || !playerState.duration) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                videoRef.current.currentTime = pct * playerState.duration;
                resetControlsTimer();
              }}>
              <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs tabular-nums text-white/50 w-10">{formatTime(playerState.duration)}</span>
          </div>
        )}

        {/* Butonlar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Geri 10s */}
            {!isLive && (
              <button onClick={() => seekTime(-10)} className="flex flex-col items-center gap-1 text-white/60 hover:text-white transition-colors">
                <div className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:border-white/40 transition-colors">
                  <span className="text-sm">⏪</span>
                </div>
                <span className="text-[9px] uppercase tracking-wider">-10s</span>
              </button>
            )}

            {/* Play/Pause */}
            <button onClick={togglePlay} className="flex flex-col items-center gap-1 group">
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shadow-[0_0_24px_-6px_rgba(59,130,246,0.5)] hover:scale-105 transition-transform">
                <span className="text-lg">{playerState.isPlaying ? '⏸' : '▶️'}</span>
              </div>
              <span className="text-[9px] uppercase tracking-wider text-white/50">{playerState.isPlaying ? 'Durdur' : 'Oynat'}</span>
            </button>

            {/* İleri 10s */}
            {!isLive && (
              <button onClick={() => seekTime(10)} className="flex flex-col items-center gap-1 text-white/60 hover:text-white transition-colors">
                <div className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:border-white/40 transition-colors">
                  <span className="text-sm">⏩</span>
                </div>
                <span className="text-[9px] uppercase tracking-wider">+10s</span>
              </button>
            )}

            {/* Ses */}
            <button onClick={toggleMute} className="flex flex-col items-center gap-1 text-white/60 hover:text-white transition-colors">
              <div className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:border-white/40 transition-colors">
                <span className="text-sm">{playerState.isMuted ? '🔇' : '🔊'}</span>
              </div>
              <span className="text-[9px] uppercase tracking-wider">Ses</span>
            </button>
          </div>

          {/* Sağ taraf */}
          <div className="flex items-center gap-4">
            {/* Zaman */}
            {!isLive && (
              <span className="text-sm tabular-nums text-white/60">
                {formatTime(playerState.currentTime)} / {formatTime(playerState.duration)}
              </span>
            )}

            {/* CANLI rozeti */}
            {isLive && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-300">CANLI</span>
              </div>
            )}

            {/* Tam Ekran */}
            <button onClick={toggleFullscreen} className="flex flex-col items-center gap-1 text-white/60 hover:text-white transition-colors">
              <div className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:border-white/40 transition-colors">
                <span className="text-sm">⛶</span>
              </div>
              <span className="text-[9px] uppercase tracking-wider">Ekran</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
