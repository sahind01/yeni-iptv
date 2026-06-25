'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { FiHeart, FiShare2, FiCheck } from 'react-icons/fi';

export default function VodPlayer({ onBack }: { onBack?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimer = useRef<NodeJS.Timeout | null>(null);
  const { currentChannel } = useStore();

  const [playerState, setPlayerState] = useState({
    isPlaying: false, isMuted: false, volume: 1, currentTime: 0, duration: 0,
    error: null as string | null, showControls: true,
  });
  const [shareCopied, setShareCopied] = useState(false);

  // VOD PLAYER - BASİT VE HATASIZ
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentChannel?.url) return;

    const url = currentChannel.url;
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.src = url;
    video.load();

    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => {
        setPlayerState(prev => ({ ...prev, error: 'Başlatmak için tıklayın ▶️' }));
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
    const onError = () => setPlayerState(prev => ({ ...prev, error: 'Yayın açılamadı' }));
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
    controlsTimer.current = setTimeout(() => { setPlayerState(prev => ({ ...prev, showControls: false })); }, 5000);
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

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (playerState.isPlaying) { video.pause(); }
    else { video.play().catch(() => {}); }
    resetControlsTimer();
  };

  const toggleMute = () => { if (videoRef.current) { videoRef.current.muted = !playerState.isMuted; resetControlsTimer(); } };
  const toggleFullscreen = () => { document.fullscreenElement ? document.exitFullscreen() : containerRef.current?.requestFullscreen(); resetControlsTimer(); };
  const skipTime = (s: number) => { if (videoRef.current && videoRef.current.duration) { videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration, videoRef.current.currentTime + s)); resetControlsTimer(); } };

  const formatTime = (t: number) => {
    if (!isFinite(t) || t < 0) return '0:00';
    const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = Math.floor(t % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !playerState.duration) return;
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    videoRef.current.currentTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * playerState.duration;
    resetControlsTimer();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: currentChannel?.name || 'Mutlu Player', text: `📺 ${currentChannel?.name} kanalını izliyorum!`, url: window.location.href })
        .catch(() => { navigator.clipboard.writeText(window.location.href); setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); });
    } else { navigator.clipboard.writeText(window.location.href); setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); }
  };

  const progress = playerState.duration > 0 ? (playerState.currentTime / playerState.duration) * 100 : 0;

  if (!currentChannel) {
    return <div className="flex items-center justify-center h-48 bg-[#111] rounded-xl"><p className="text-gray-500">İçerik seçilmedi</p></div>;
  }

  return (
    <div ref={containerRef} className="relative w-full bg-black overflow-hidden rounded-xl" style={{ aspectRatio: '16/9' }}>
      <video ref={videoRef} className="w-full h-full object-contain" playsInline />

      {!playerState.isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-20 cursor-pointer" onClick={togglePlay}>
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/30 transition-all">
            <span className="text-3xl">{playerState.error ? '🔄' : '▶️'}</span>
          </div>
        </div>
      )}

      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between">
        {onBack ? <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="px-3 py-1.5 bg-black/50 backdrop-blur rounded-lg text-sm hover:bg-black/70">← Geri</button> : <div />}
        <button onClick={(e) => { e.stopPropagation(); handleShare(); }} className="px-3 py-1.5 bg-black/50 backdrop-blur rounded-lg text-sm hover:bg-black/70 flex items-center gap-1.5">
          {shareCopied ? <><FiCheck className="w-3.5 h-3.5 text-green-400" /><span className="text-xs text-green-400">Kopyalandı!</span></> : <><FiShare2 className="w-3.5 h-3.5" /><span className="text-xs">Paylaş</span></>}
        </button>
      </div>

      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 sm:p-4 pt-10 sm:pt-12 z-20 transition-opacity duration-300 ${playerState.showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="mb-2 sm:mb-3">
          <div className="relative h-1.5 sm:h-2 bg-gray-600/50 rounded-full cursor-pointer" onClick={handleSeek}>
            <div className="absolute h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] sm:text-[10px] text-gray-400">{formatTime(playerState.currentTime)}</span>
            <span className="text-[9px] sm:text-[10px] text-gray-400">{formatTime(playerState.duration)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button onClick={() => skipTime(-10)} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg text-xs sm:text-sm">⏪</button>
            <button onClick={togglePlay} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg text-base sm:text-lg">{playerState.isPlaying ? '⏸' : '▶️'}</button>
            <button onClick={() => skipTime(10)} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg text-xs sm:text-sm">⏩</button>
            <button onClick={toggleMute} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg">{playerState.isMuted || playerState.volume === 0 ? '🔇' : '🔊'}</button>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <span className="text-[9px] sm:text-xs text-gray-400">{formatTime(playerState.currentTime)} / {formatTime(playerState.duration)}</span>
            <button onClick={toggleFullscreen} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg text-base sm:text-lg">⛶</button>
          </div>
        </div>
      </div>
    </div>
  );
}
