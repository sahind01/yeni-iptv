'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiHeart, FiPlay } from 'react-icons/fi';
import Image from 'next/image';
import type { Channel } from '@/types';
import { helpers } from '@/utils/helpers';

interface ChannelCardProps {
  channel: Channel;
  isFavorite: boolean;
  onSelect: (channel: Channel) => void;
  onFavoriteToggle: (channel: Channel) => void;
  isTVMode?: boolean;
}

export default function ChannelCard({ 
  channel, 
  isFavorite, 
  onSelect, 
  onFavoriteToggle,
  isTVMode = false 
}: ChannelCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const quality = helpers.getQualityLabel(channel);

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteToggle(channel);
  }, [channel, onFavoriteToggle]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={`channel-card group ${isTVMode ? 'tv-focused' : ''}`}
      onClick={() => onSelect(channel)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
      role="button"
      aria-label={`${channel.name} kanalını izle`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(channel);
        }
      }}
    >
      {/* Kanal Logosu */}
      <div className="relative aspect-video bg-[#111] overflow-hidden">
        {!imageError ? (
          <Image
            src={channel.logo}
            alt={channel.name}
            fill
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-110"
            onError={() => setImageError(true)}
            loading="lazy"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-600/20 
                rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl font-bold text-gray-600">
                  {channel.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Kalite Rozeti */}
        <div className={`quality-badge ${quality === 'HD' ? 'quality-HD' : 
          quality === 'FHD' ? 'quality-FHD' : 
          quality === '4K' ? 'quality-4K' : 'bg-gray-500/80 text-white'}`}>
          {quality}
        </div>

        {/* Hover Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="absolute inset-0 bg-black/50 flex items-center justify-center"
        >
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
            <FiPlay className="w-5 h-5 ml-0.5" />
          </div>
        </motion.div>
      </div>

      {/* Kanal Bilgisi */}
      <div className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 mr-2">
            <h3 className="text-sm font-medium truncate">{channel.name}</h3>
            <p className="text-xs text-gray-500 truncate mt-0.5">{channel.group}</p>
          </div>
          
          <button
            onClick={handleFavoriteClick}
            className={`p-1.5 rounded-lg transition-all duration-200 flex-shrink-0
              ${isFavorite 
                ? 'text-red-500 hover:text-red-400' 
                : 'text-gray-600 hover:text-red-500'
              }`}
            aria-label={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          >
            <motion.div
              animate={{ scale: isFavorite ? [1, 1.3, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              <FiHeart
                className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`}
              />
            </motion.div>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
