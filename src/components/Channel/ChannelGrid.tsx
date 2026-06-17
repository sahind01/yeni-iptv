'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import type { Channel } from '@/types';
import ChannelCard from './ChannelCard';

interface ChannelGridProps {
  channels: Channel[];
  favorites: Set<string>;
  onChannelSelect: (channel: Channel) => void;
  onFavoriteToggle: (channel: Channel) => void;
}

export default function ChannelGrid({
  channels,
  favorites,
  onChannelSelect,
  onFavoriteToggle,
}: ChannelGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Sanal listeleme için row virtualizer
  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(channels.length / getColumnsCount()),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 5,
  });

  function getColumnsCount() {
    if (typeof window === 'undefined') return 4;
    if (window.innerWidth < 640) return 2;  // mobil
    if (window.innerWidth < 1024) return 3; // tablet
    if (window.innerWidth < 1280) return 4; // küçük ekran
    return 5; // büyük ekran
  }

  const columns = getColumnsCount();

  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <span className="text-6xl mb-4">📺</span>
        <h3 className="text-lg font-medium text-gray-400">Kanal bulunamadı</h3>
        <p className="text-sm text-gray-500 mt-1">
          Farklı bir arama terimi deneyin veya kategoriyi değiştirin.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="h-full overflow-auto"
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const rowChannels = channels.slice(startIndex, startIndex + columns);

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-4">
                <AnimatePresence mode="popLayout">
                  {rowChannels.map((channel, index) => (
                    <motion.div
                      key={channel.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ChannelCard
                        channel={channel}
                        isFavorite={favorites.has(channel.id)}
                        onSelect={onChannelSelect}
                        onFavoriteToggle={onFavoriteToggle}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
