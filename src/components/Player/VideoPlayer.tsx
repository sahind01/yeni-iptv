'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { helpers } from '@/utils/helpers';

interface VideoPlayerProps {
  onBack?: () => void;
}

export default function VideoPlayer({ onBack }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { currentChannel } = useStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferHealth, setBufferHealth] = useState(0);
  const [quality, setQuality] = useState('auto');
  const [qualityLevel, setQualityLevel] = useState(-1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  const QUALITY_OPTIONS = [
    { value: 'auto', label: 'Otomatik' },
    { value: '1080p', label: '1080p FHD' },
    { value: '720p', label: '720p HD' },
    { value: '480p', label: '480p SD' },
    { value: '360p', label: '360p' },
  ];

  // HLS Player başlatma
  useEffect(() => {
    if (!currentChannel?.url || !videoRef.current) return;

    const video = videoRef.current;
    
    // Önceki instance'ı temizle
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 4,
        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 4,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 6,
      });

      hlsRef.current = hls;
      hls.loadSource(currentChannel.url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
        reconnectAttempts.current = 0;
        setError(null);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (reconnectAttempts.current < 5) {
                const delay = 2000 * Math.pow(2, reconnectAttempts.current);
                setError(`Bağlantı kesildi. Yeniden bağlanılıyor...`);
                reconnectTimer.current = setTimeout(() => {
                  hls.loadSource(currentChannel.url);
                  reconnectAttempts.current++;
                }, delay);
              } else {
                setError('Yayın geçici olarak kullanılamıyor');
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setError('Yayın geçici olarak kullanılamıyor');
              break;
          }
        }
      });

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = currentChannel.url;
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
    };
  }, [currentChannel?.url]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(video.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

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

  // Kontrolleri otomatik gizle
  const resetControlsTimer = useCallback(() => {
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    setShowControls(true);
    if (isPlaying) {
      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onMouseMove = () => resetControlsTimer();
    const onMouseLeave = () => { if (isPlaying) setShowControls(false); };

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseleave', onMouseLeave);

    return () => {
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [resetControlsTimer, isPlaying]);

  // Oynat/Durdur
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  // Ses aç/kapat
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Ses seviyesi
  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = Math.max(0, Math.min(1, newVolume));
      setVolume(newVolume);
    }
  };

  // İleri/geri sarma
  const handleSeek = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  // Tam ekran
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Picture in Picture
  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } else {
        await videoRef.current?.requestPictureInPicture();
        setIsPiP(true);
      }
    } catch (err) {
      console.error('PiP hatası:', err);
    }
  };

  // Kalite değiştir
  const handleQualityChange = (level: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
      setQualityLevel(level);
      setQuality(level === -1 ? 'auto' : `${hlsRef.current.levels[level]?.height}p`);
    }
    setShowQualityMenu(false);
  };

  // Progress hesapla
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Seek bar tıklama
  const handleSeekBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    const diff = newTime - currentTime;
    handleSeek(diff);
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
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
      className="relative w-full bg-black overflow-hidden rounded-xl"
      style={{ aspectRatio: '16/9' }}
      onClick={togglePlay}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        autoPlay
        poster="/images/poster.jpg"
      />

      {/* Hata Mesajı */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/80 z-20"
          >
            <div className="text-center">
              <span className="text-4xl block mb-4">⚠️</span>
              <p className="text-gray-300 font-medium mb-4">{error}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentChannel?.url && videoRef.current && Hls.isSupported()) {
                    const hls = new Hls({
                      enableWorker: true,
                      lowLatencyMode: true,
                    });
                    hlsRef.current = hls;
                    hls.loadSource(currentChannel.url);
                    hls.attachMedia(videoRef.current);
                    setError(null);
                    reconnectAttempts.current = 0;
                  }
                }}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm transition-colors"
              >
                Tekrar Dene
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kanal Bilgisi (Üst) */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10"
          >
            <div className="flex items-center space-x-3">
              {onBack && (
                <button
                  onClick={(e) => { e.stopPropagation(); onBack(); }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-sm"
                >
                  ← Geri
                </button>
              )}
              <div>
                <h2 className="text-sm font-medium">{currentChannel.name}</h2>
                <p className="text-xs text-gray-400">{currentChannel.group}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alt Kontroller */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 z-10"
          >
            <div className="bg-gradient-to-t from-black/90 to-transparent p-4 pt-8">
              {/* İlerleme Çubuğu */}
              <div className="mb-3">
                <div
                  className="relative h-1 bg-gray-600/50 rounded-full cursor-pointer group"
                  onClick={handleSeekBarClick}
                >
                  <div
                    className="absolute h-full bg-blue-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ left: `${progress}%`, marginLeft: -6 }}
                  />
                </div>
              </div>

              {/* Butonlar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Play/Pause */}
                  <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="p-2 hover:bg-white/10 rounded-lg">
                    {isPlaying ? (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                    )}
                  </button>

                  {/* Ses */}
                  <div className="flex items-center space-x-1 group">
                    <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="p-2 hover:bg-white/10 rounded-lg">
                      {isMuted || volume === 0 ? (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                      ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-0 group-hover:w-20 transition-all duration-200 accent-blue-500 h-1"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Zaman */}
                  <span className="text-xs text-gray-400">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Kalite */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowQualityMenu(!showQualityMenu); }}
                    className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
                  >
                    {quality.toUpperCase()}
                  </button>

                  {/* PiP */}
                  <button onClick={(e) => { e.stopPropagation(); togglePiP(); }} className="p-2 hover:bg-white/10 rounded-lg">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="2" y="4" width="16" height="12" rx="2"/><rect x="12" y="10" width="10" height="10" rx="2"/></svg>
                  </button>

                  {/* Tam Ekran */}
                  <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} className="p-2 hover:bg-white/10 rounded-lg">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kalite Menüsü */}
      <AnimatePresence>
        {showQualityMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/60 z-30"
            onClick={() => setShowQualityMenu(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-[#1a1a1a] border border-gray-700 rounded-2xl p-4 w-64"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-medium mb-3">Kalite</h3>
              <div className="space-y-1">
                {QUALITY_OPTIONS.map((option, index) => (
                  <button
                    key={option.value}
                    onClick={() => handleQualityChange(index - 1)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      qualityLevel === index - 1 ? 'bg-blue-500/10 text-blue-400' : 'hover:bg-white/5 text-gray-400'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
