'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';

export default function VideoPlayer({ onBack }: { onBack?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const controlsTimer = useRef<NodeJS.Timeout | null>(null);

  const { currentChannel } = useStore();

  const [playerState, setPlayerState] = useState({
    isPlaying: false,
    isMuted: false,
    volume: 1,
    currentTime: 0,
    duration: 0,
    quality: 'auto',
    qualityLevel: -1,
    error: null as string | null,
    showControls: true,
    showQualityMenu: false,
  });

  const QUALITY_OPTIONS = [
    { value: 'auto', label: 'Otomatik', level: -1 },
    { value: '1080p', label: '1080p FHD', level: 0 },
    { value: '720p', label: '720p HD', level: 1 },
    { value: '480p', label: '480p SD', level: 2 },
    { value: '360p', label: '360p', level: 3 },
  ];

  // HLS Player
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentChannel?.url) return;

    destroyPlayer();

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 30,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 4,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 6,
      });

      hlsRef.current = hls;
      hls.loadSource(currentChannel.url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
        reconnectAttempts.current = 0;
        setPlayerState(prev => ({ ...prev, error: null }));
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            if (reconnectAttempts.current < 5) {
              const delay = 2000 * Math.pow(2, reconnectAttempts.current);
              setPlayerState(prev => ({ ...prev, error: 'Bağlantı kesildi, yeniden bağlanılıyor...' }));
              reconnectTimer.current = setTimeout(() => {
                hls.loadSource(currentChannel.url);
                reconnectAttempts.current++;
              }, delay);
            } else {
              setPlayerState(prev => ({ ...prev, error: 'Yayın geçici olarak kullanılamıyor' }));
            }
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            setPlayerState(prev => ({ ...prev, error: 'Yayın açılamadı' }));
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = currentChannel.url;
      video.play().catch(() => {});
    }

    return () => {
      destroyPlayer();
    };
  }, [currentChannel?.url]);

  const destroyPlayer = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
  };

  // Video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setPlayerState(prev => ({ ...prev, currentTime: video.currentTime }));
    const onDurationChange = () => setPlayerState(prev => ({ ...prev, duration: video.duration }));
    const onPlay = () => setPlayerState(prev => ({ ...prev, isPlaying: true }));
    const onPause = () => setPlayerState(prev => ({ ...prev, isPlaying: false }));
    const onVolumeChange = () => setPlayerState(prev => ({ ...prev, volume: video.volume, isMuted: video.muted }));

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('volumechange', onVolumeChange);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('volumechange', onVolumeChange);
    };
  }, []);

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    setPlayerState(prev => ({ ...prev, showControls: true }));
    if (playerState.isPlaying) {
      controlsTimer.current = setTimeout(() => {
        setPlayerState(prev => ({ ...prev, showControls: false }));
      }, 3000);
    }
  }, [playerState.isPlaying]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('mousemove', resetControlsTimer);
    container.addEventListener('mouseleave', () => {
      if (playerState.isPlaying) setPlayerState(prev => ({ ...prev, showControls: false }));
    });
    return () => {
      container.removeEventListener('mousemove', resetControlsTimer);
    };
  }, [resetControlsTimer, playerState.isPlaying]);

  const updateState = (updates: Partial<typeof playerState>) => {
    setPlayerState(prev => ({ ...prev, ...updates }));
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playerState.isPlaying) videoRef.current.pause();
    else videoRef.current.play();
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !playerState.isMuted;
  };

  const changeVolume = (vol: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = Math.max(0, Math.min(1, vol));
  };

  const seekTime = (sec: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += sec;
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current?.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP error:', err);
    }
  };

  const changeQuality = (level: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
      const label = level === -1 ? 'auto' : `${hlsRef.current.levels[level]?.height}p`;
      updateState({ quality: label, qualityLevel: level, showQualityMenu: false });
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

  const onSeekBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    seekTime(pct * playerState.duration - playerState.currentTime);
  };

  if (!currentChannel) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#111] rounded-xl">
        <p className="text-gray-500">Kanal seçilmedi</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black overflow-hidden rounded-xl group"
      style={{ aspectRatio: '16/9' }}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        autoPlay
      />

      {/* Error overlay */}
      {playerState.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-center">
            <span className="text-4xl block mb-4">⚠️</span>
            <p className="text-gray-300 mb-4">{playerState.error}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (currentChannel?.url && videoRef.current && Hls.isSupported()) {
                  destroyPlayer();
                  const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
                  hlsRef.current = hls;
                  hls.loadSource(currentChannel.url);
                  hls.attachMedia(videoRef.current);
                  updateState({ error: null });
                  reconnectAttempts.current = 0;
                }
              }}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      )}

      {/* Top bar */}
      {playerState.showControls && (
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10">
          <div className="flex items-center space-x-3">
            {onBack && (
              <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="p-2 hover:bg-white/10 rounded-lg text-sm">
                ← Geri
              </button>
            )}
            <div>
              <h2 className="text-sm font-medium">{currentChannel.name}</h2>
              <p className="text-xs text-gray-400">{currentChannel.group}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      {playerState.showControls && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/90 to-transparent p-4 pt-8">
          {/* Seek bar */}
          <div className="mb-3 cursor-pointer" onClick={onSeekBarClick}>
            <div className="relative h-1 bg-gray-600/50 rounded-full">
              <div className="absolute h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${progress}%`, marginLeft: -6 }}
              />
            </div>
          </div>

          {/* Buttons row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="p-2 hover:bg-white/10 rounded-lg">
                {playerState.isPlaying ? '⏸' : '▶️'}
              </button>

              <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="p-2 hover:bg-white/10 rounded-lg">
                {playerState.isMuted ? '🔇' : '🔊'}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={playerState.volume}
                onChange={(e) => changeVolume(parseFloat(e.target.value))}
                className="w-20 accent-blue-500 h-1 hidden sm:block"
                onClick={(e) => e.stopPropagation()}
              />

              <span className="text-xs text-gray-400">
                {formatTime(playerState.currentTime)} / {formatTime(playerState.duration)}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => { e.stopPropagation(); updateState({ showQualityMenu: !playerState.showQualityMenu }); }}
                className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded"
              >
                {playerState.quality.toUpperCase()}
              </button>

              <button onClick={(e) => { e.stopPropagation(); togglePiP(); }} className="p-2 hover:bg-white/10 rounded-lg text-sm">
                PiP
              </button>

              <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} className="p-2 hover:bg-white/10 rounded-lg">
                ⛶
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quality menu */}
      {playerState.showQualityMenu && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/60 z-30"
          onClick={() => updateState({ showQualityMenu: false })}
        >
          <div
            className="bg-[#1a1a1a] border border-gray-700 rounded-2xl p-4 w-64"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-medium mb-3">Kalite</h3>
            <div className="space-y-1">
              {QUALITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => changeQuality(opt.level)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm ${
                    playerState.qualityLevel === opt.level ? 'bg-blue-500/10 text-blue-400' : 'hover:bg-white/5 text-gray-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
