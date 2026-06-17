'use client';

import { FiPlay, FiPause, FiVolume2, FiVolumeX, 
  FiMaximize, FiMinimize } from 'react-icons/fi';
import { helpers } from '@/utils/helpers';

interface PlayerControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  bufferHealth: number;
  quality: string;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (seconds: number) => void;
  onToggleFullscreen: () => void;
  onTogglePiP: () => void;
  onQualityClick: () => void;
}

export default function PlayerControls({
  isPlaying,
  isMuted,
  volume,
  currentTime,
  duration,
  bufferHealth,
  quality,
  onTogglePlay,
  onToggleMute,
  onVolumeChange,
  onToggleFullscreen,
  onTogglePiP,
  onQualityClick,
}: PlayerControlsProps) {
  
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    const diff = newTime - currentTime;
    onSeek(diff);
  };

  return (
    <div className="bg-gradient-to-t from-black/90 to-transparent p-4 pt-8">
      {/* İlerleme Çubuğu */}
      <div className="mb-3">
        <div
          className="relative h-1 bg-gray-600/50 rounded-full cursor-pointer group"
          onClick={handleSeek}
        >
          {/* Buffer */}
          <div
            className="absolute h-full bg-gray-500/30 rounded-full"
            style={{ width: `${bufferHealth * 100}%` }}
          />
          {/* Progress */}
          <div
            className="absolute h-full bg-blue-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-400 rounded-full 
              opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            style={{ left: `${progress}%`, marginLeft: -6 }}
          />
        </div>
      </div>

      {/* Kontroller */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Play/Pause */}
          <button onClick={onTogglePlay} className="btn-icon">
            {isPlaying ? <FiPause className="w-5 h-5" /> : <FiPlay className="w-5 h-5" />}
          </button>

          {/* Ses */}
          <div className="flex items-center space-x-2 group">
            <button onClick={onToggleMute} className="btn-icon">
              {isMuted ? <FiVolumeX className="w-5 h-5" /> : <FiVolume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-0 group-hover:w-20 transition-all duration-200
                accent-blue-500 h-1"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Zaman */}
          <span className="text-xs text-gray-400">
            {helpers.formatTime(currentTime)} / {helpers.formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Kalite */}
          <button
            onClick={onQualityClick}
            className="px-2 py-1 text-xs bg-white/10 rounded hover:bg-white/20 transition-colors"
          >
            {quality.toUpperCase()}
          </button>

          {/* PiP */}
          <button onClick={onTogglePiP} className="btn-icon" title="Picture in Picture">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <rect x="2" y="4" width="16" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
              <rect x="12" y="10" width="10" height="10" rx="2" />
            </svg>
          </button>

          {/* Tam Ekran */}
          <button onClick={onToggleFullscreen} className="btn-icon">
            <FiMaximize className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
