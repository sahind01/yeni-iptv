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

  const qualityBadge = channel.quality && channel.quality !== 'SD' ? channel.quality : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-[#1a1a1a] rounded-lg overflow-hidden cursor-pointer 
        hover:bg-[#222] active:scale-[0.98] transition-all duration-150
        border border-gray-800/30"
      onClick={() => onSelect(channel)}
    >
      {/* Logo */}
      <div className="relative aspect-video bg-[#111] flex items-center justify-center p-2 sm:p-3">
        {!imageError && channel.logo && !channel.logo.includes('default-channel') ? (
          <img
            src={channel.logo}
            alt={channel.name}
            className="w-full h-full object-contain"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center">
            <span className="text-sm sm:text-base font-bold text-gray-500">
              {channel.name?.charAt(0)?.toUpperCase() || '📺'}
            </span>
          </div>
        )}

        {/* Kalite Rozeti - Küçük */}
        {qualityBadge && (
          <div className={`absolute top-1 right-1 px-1 py-0.5 rounded text-[8px] sm:text-[10px] font-bold
            ${qualityBadge === '4K' ? 'bg-red-500/90' : 
              qualityBadge === 'FHD' ? 'bg-purple-500/90' : 'bg-blue-500/90'} text-white`}>
            {qualityBadge}
          </div>
        )}
      </div>

      {/* Bilgi */}
      <div className="p-2 sm:p-2.5">
        <div className="flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0">
            <h3 className="text-[11px] sm:text-xs font-medium text-white truncate leading-tight">
              {channel.name || 'Kanal'}
            </h3>
            <p className="text-[9px] sm:text-[10px] text-gray-500 truncate mt-0.5">
              {channel.group || ''}
            </p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle(channel);
            }}
            className={`flex-shrink-0 p-0.5 rounded transition-all ${
              isFavorite ? 'text-red-500' : 'text-gray-600 hover:text-red-400'
            }`}
          >
            <FiHeart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
