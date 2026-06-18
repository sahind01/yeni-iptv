'use client';

import { motion } from 'framer-motion';
import { FiHeart, FiPlay } from 'react-icons/fi';
import type { Channel } from '@/types';

interface ChannelListProps {
  channels: Channel[];
  favorites: Set<string>;
  onChannelSelect: (channel: Channel) => void;
  onFavoriteToggle: (channel: Channel) => void;
}

export default function ChannelList({ channels, favorites, onChannelSelect, onFavoriteToggle }: ChannelListProps) {
  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <span className="text-4xl mb-4">📺</span>
        <p className="text-gray-400 text-sm">Kanal bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {channels.map((channel, index) => (
        <motion.div
          key={channel.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.02 }}
          className="flex items-center space-x-3 p-3 bg-[#1a1a1a] rounded-xl cursor-pointer 
            hover:bg-[#252525] border border-gray-800/30 active:scale-[0.99] transition-all"
          onClick={() => onChannelSelect(channel)}
        >
          {/* Logo */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#111] rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            {channel.logo && !channel.logo.includes('default-channel') ? (
              <img src={channel.logo} alt={channel.name} className="w-8 h-8 sm:w-10 sm:h-10 object-contain" loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <span className="text-lg font-bold text-gray-600">{channel.name?.charAt(0)?.toUpperCase() || '📺'}</span>
            )}
          </div>

          {/* Bilgi */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-white truncate">{channel.name}</h3>
            <p className="text-xs text-gray-500 truncate">{channel.group || 'Diğer'}</p>
          </div>

          {/* Kalite */}
          {channel.quality && channel.quality !== 'SD' && (
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0 ${
              channel.quality === '4K' ? 'bg-red-500/80' : channel.quality === 'FHD' ? 'bg-purple-500/80' : 'bg-blue-500/80'
            } text-white`}>
              {channel.quality}
            </span>
          )}

          {/* Favori */}
          <button
            onClick={(e) => { e.stopPropagation(); onFavoriteToggle(channel); }}
            className={`p-2 rounded-lg flex-shrink-0 ${favorites.has(channel.id) ? 'text-red-500' : 'text-gray-600'}`}
          >
            <FiHeart className={`w-4 h-4 ${favorites.has(channel.id) ? 'fill-current' : ''}`} />
          </button>

          {/* Oynat */}
          <button className="p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg flex-shrink-0 text-blue-400">
            <FiPlay className="w-4 h-4" />
          </button>
        </motion.div>
      ))}
    </div>
  );
}
