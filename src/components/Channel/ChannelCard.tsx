'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiHeart } from 'react-icons/fi';
import type { Channel } from '@/types';

interface ChannelCardProps {
  channel: Channel;
  isFavorite: boolean;
  onSelect: (channel: Channel) => void;
  onFavoriteToggle: (channel: Channel) => void;
}

export default function ChannelCard({ channel, isFavorite, onSelect, onFavoriteToggle }: ChannelCardProps) {
  const [imageError, setImageError] = useState(false);

  const getQualityBadge = (quality: string) => {
    if (quality === '4K' || quality === 'UHD') return 'bg-red-500 text-white';
    if (quality === 'FHD' || quality === '1080p') return 'bg-purple-500 text-white';
    if (quality === 'HD' || quality === '720p') return 'bg-blue-500 text-white';
    return 'bg-gray-600 text-gray-300';
  };

  const showBadge = channel.quality && channel.quality !== 'SD';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-[#1a1a1a] rounded-xl overflow-hidden cursor-pointer hover:bg-[#252525] transition-all duration-200 border border-gray-800/50 hover:border-gray-700/50"
      onClick={() => onSelect(channel)}
    >
      {/* Logo Alanı */}
      <div className="relative aspect-video bg-[#111] flex items-center justify-center p-4">
        {!imageError && channel.logo && channel.logo !== '/icons/default-channel.png' ? (
          <img
            src={channel.logo}
            alt={channel.name}
            className="max-w-full max-h-full object-contain"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto">
              <span className="text-xl font-bold text-gray-400">
                {channel.name?.charAt(0)?.toUpperCase() || '📺'}
              </span>
            </div>
          </div>
        )}

        {/* Kalite Rozeti */}
        {showBadge && (
          <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold ${getQualityBadge(channel.quality)}`}>
            {channel.quality}
          </div>
        )}
      </div>

      {/* Kanal Bilgisi */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-white truncate">
              {channel.name || 'Bilinmeyen Kanal'}
            </h3>
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {channel.group || 'Diğer'}
            </p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle(channel);
            }}
            className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${
              isFavorite ? 'text-red-500 bg-red-500/10' : 'text-gray-600 hover:text-red-500 hover:bg-red-500/5'
            }`}
          >
            <FiHeart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
