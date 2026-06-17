'use client';

import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import ChannelCard from './ChannelCard';
import type { Channel } from '@/types';

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

  function getColumnsCount() {
    if (typeof window === 'undefined') return 5;
    if (window.innerWidth < 640) return 2;
    if (window.innerWidth < 1024) return 3;
    if (window.innerWidth < 1280) return 4;
    return 5;
  }

  const columns = getColumnsCount();
  const totalRows = Math.ceil(channels.length / columns);

  const rowVirtualizer = useVirtualizer({
    count: totalRows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 220,
    overscan: 5,
  });

  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <span className="text-6xl mb-4">📺</span>
        <h3 className="text-lg font-medium text-gray-400">Kanal bulunamadı</h3>
        <p className="text-sm text-gray-500 mt-1">Farklı bir kategori seçin veya arama yapın.</p>
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-[calc(100vh-200px)] overflow-auto">
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
              <div 
                className="grid gap-3 p-4"
                style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
              >
                <AnimatePresence mode="popLayout">
                  {rowChannels.map((channel) => (
                    <motion.div
                      key={channel.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
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
