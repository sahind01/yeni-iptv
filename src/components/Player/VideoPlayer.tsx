'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useStore } from '@/store/useStore';
import { FiHeart } from 'react-icons/fi';

export default function VideoPlayer({ onBack }: { onBack?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimer = useRef<NodeJS.Timeout | null>(null);
  const adRef = useRef<HTMLDivElement>(null);
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

  // Reklam scriptini yükle
  useEffect(() => {
    if (adRef.current) {
      const script = document.createElement('script');
      script.src = 'https://www.highperformanceformat.com/17d00916f28f83916acf6ce35dca6c88/invoke.js';
      script.async = true;
      
      // atOptions
      (window as any).atOptions = {
        'key': '17d00916f28f83916acf6ce35dca6c88',
        'format': 'iframe',
        'height': 50,
        'width': 320,
        'params': {}
      };
      
      adRef.current.appendChild(script);

      return () => {
        if (adRef.current) {
          adRef.current.innerHTML = '';
        }
      };
    }
  }, [currentChannel?.url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentChannel?.url) return;

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    const url = currentChannel.url;
    const isLiveStream = url.includes('.m3u8') && (url.includes('live') || url.includes('stream') || url.includes('tv') || url.includes('channel'));
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

    return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
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

  const resetControlsTimer = () => {
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    setPlayerState(prev => ({ ...prev, showControls: true }));
    controlsTimer.current = setTimeout(() => {
      setPlayerState(prev => ({ ...prev, showControls: false }));
    }, 5000);
  };

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

  const togglePlay = () => { if (videoRef.current) { videoRef.current[playerState.isPlaying ? 'pause' : 'play'](); resetControlsTimer(); } };
  const toggleMute = () => { if (videoRef.current) { videoRef.current.muted = !playerState.isMuted; resetControlsTimer(); } };
  const changeVolume = (v: number) => { if (videoRef.current) { videoRef.current.volume = Math.max(0, Math.min(1, v)); resetControlsTimer(); } };
  const toggleFullscreen = () => { document.fullscreenElement ? document.exitFullscreen() : containerRef.current?.requestFullscreen(); resetControlsTimer(); };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !playerState.duration) return;
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = pct * playerState.duration;
    resetControlsTimer();
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds));
      resetControlsTimer();
    }
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
    <div className="space-y-2">
      {/* Player */}
      <div ref={containerRef} className="relative w-full bg-black overflow-hidden rounded-xl group" style={{ aspectRatio: '16/9' }}>
        <video ref={videoRef} className="w-full h-full object-contain" playsInline autoPlay />

        {/* HATA */}
        {playerState.error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
            <div className="text-center">
              <p className="text-gray-300 text-sm mb-3">{playerState.error}</p>
              <button onClick={() => { if (videoRef.current) { videoRef.current.load(); videoRef.current.play().catch(() => {}); } }}
                className="px-5 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm">Tekrar Dene</button>
            </div>
          </div>
        )}

        {/* GERİ TUŞU */}
        {onBack && (
          <div className="absolute top-3 left-3 z-30">
            <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="px-3 py-1.5 bg-black/50 backdrop-blur rounded-lg text-sm hover:bg-black/70">← Geri</button>
          </div>
        )}

        {/* KANAL ADI */}
        {playerState.showControls && (
          <div className="absolute top-3 right-3 z-20">
            <p className="text-xs bg-black/50 backdrop-blur px-3 py-1.5 rounded-lg text-white/80">{currentChannel.name}</p>
          </div>
        )}

        {/* ALT KONTROLLER */}
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12 z-20 transition-opacity duration-300 ${playerState.showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {!playerState.isLive && (
            <div className="mb-3">
              <div className="relative h-2 bg-gray-600/50 rounded-full cursor-pointer group" onClick={handleSeek}>
                <div className="absolute h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
                <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-lg" style={{ left: `${progress}%`, marginLeft: -8 }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-gray-400">{formatTime(playerState.currentTime)}</span>
                <span className="text-[10px] text-gray-400">{formatTime(playerState.duration)}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {!playerState.isLive && (
                <button onClick={() => skipTime(-10)} className="p-2 hover:bg-white/10 rounded-lg text-sm">⏪</button>
              )}
              <button onClick={togglePlay} className="p-2 hover:bg-white/10 rounded-lg text-lg">
                {playerState.isPlaying ? '⏸' : '▶️'}
              </button>
              {!playerState.isLive && (
                <button onClick={() => skipTime(10)} className="p-2 hover:bg-white/10 rounded-lg text-sm">⏩</button>
              )}
              <button onClick={toggleMute} className="p-2 hover:bg-white/10 rounded-lg">
                {playerState.isMuted || playerState.volume === 0 ? '🔇' : '🔊'}
              </button>
              <input type="range" min="0" max="1" step="0.1" value={playerState.volume}
                onChange={(e) => changeVolume(parseFloat(e.target.value))}
                className="w-16 h-1 accent-blue-500 hidden sm:block" />
            </div>

            <div className="flex items-center space-x-2">
              {!playerState.isLive && (
                <span className="text-xs text-gray-400">{formatTime(playerState.currentTime)} / {formatTime(playerState.duration)}</span>
              )}
              <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-lg text-lg">⛶</button>
            </div>
          </div>
        </div>
      </div>

      {/* REKLAM VE DESTEK BANNER */}
      <div className="bg-[#1a1a1a] border border-gray-700/50 rounded-xl overflow-hidden">
        {/* Destek Mesajı */}
        <div className="px-4 py-2.5 flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-gray-700/30">
          <div className="flex items-center gap-2">
            <span className="text-lg">🙏</span>
            <div>
              <p className="text-xs text-white font-medium">Mutlu Player'a destek ol!</p>
              <p className="text-[10px] text-gray-400">Bizlere destek olmak için aşağıdaki reklama tıklar mısın?</p>
            </div>
          </div>
          <FiHeart className="w-5 h-5 text-red-400 animate-pulse" />
        </div>
        
        {/* Reklam Alanı */}
        <div className="p-3 flex justify-center bg-[#111]" ref={adRef}>
          <div className="w-[320px] h-[50px] bg-gray-800/50 rounded flex items-center justify-center text-[10px] text-gray-500">
            Reklam yükleniyor...
          </div>
        </div>
      </div>
    </div>
  );
}
