'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { motion, AnimatePresence } from 'framer-motion';
import PlayerControls from './PlayerControls';
import QualitySelector from './QualitySelector';
import { useStore } from '@/store/useStore';
import { usePlayer } from '@/hooks/usePlayer';

interface VideoPlayerProps {
  onBack?: () => void;
}

export default function VideoPlayer({ onBack }: VideoPlayerProps) {
  const { videoRef, playerState, togglePlay, toggleMute, setVolume, 
    toggleFullscreen, togglePiP, seek, setQuality, destroyPlayer } = usePlayer();
  
  const { currentChannel } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Kontrolleri otomatik gizle
  const resetControlsTimer = useCallback(() => {
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
    setShowControls(true);
    
    if (playerState.isPlaying) {
      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [playerState.isPlaying]);

  // Mouse hareketi
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = () => resetControlsTimer();
    const handleMouseLeave = () => {
      if (playerState.isPlaying) {
        setShowControls(false);
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, [resetControlsTimer, playerState.isPlaying]);

  // Klavye kontrolleri
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, playerState.volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, playerState.volume - 0.1));
          break;
        case 'Escape':
          if (onBack) onBack();
          break;
      }
      resetControlsTimer();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleMute, toggleFullscreen, seek, setVolume, playerState.volume, onBack]);

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
      onDoubleClick={toggleFullscreen}
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
        {playerState.error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/80"
          >
            <div className="text-center">
              <span className="text-4xl mb-4 block">⚠️</span>
              <p className="text-gray-300 font-medium">{playerState.error}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentChannel?.url) {
                    // Tekrar dene
                  }
                }}
                className="mt-4 px-4 py-2 bg-blue-500 rounded-lg text-sm"
              >
                Tekrar Dene
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Yükleniyor */}
      <AnimatePresence>
        {playerState.bufferHealth < 1 && playerState.isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}
      </AnimatePresence>

      {/* Kanal Bilgisi (Üst) */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent"
          >
            <div className="flex items-center space-x-3">
              {onBack && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onBack();
                  }}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
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

      {/* Orta Buton (Play/Pause) */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
              {playerState.isPlaying ? (
                <svg className="w-8 h-8" fill="white" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg className="w-8 h-8 ml-1" fill="white" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
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
            className="absolute bottom-0 left-0 right-0"
          >
            <PlayerControls
              isPlaying={playerState.isPlaying}
              isMuted={playerState.isMuted}
              volume={playerState.volume}
              currentTime={playerState.currentTime}
              duration={playerState.duration}
              bufferHealth={playerState.bufferHealth}
              quality={playerState.quality}
              onTogglePlay={togglePlay}
              onToggleMute={toggleMute}
              onVolumeChange={setVolume}
              onSeek={seek}
              onToggleFullscreen={toggleFullscreen}
              onTogglePiP={togglePiP}
              onQualityClick={() => setShowQualityMenu(!showQualityMenu)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kalite Seçici */}
      <AnimatePresence>
        {showQualityMenu && (
          <QualitySelector
            onSelect={(level) => {
              setQuality(level);
              setShowQualityMenu(false);
            }}
            onClose={() => setShowQualityMenu(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
