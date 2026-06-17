'use client';

import { useRef, useEffect, useState } from 'react';
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
  const [columns, setColumns] = useState(5);

  useEffect(() => {
    const updateColumns = () => {
      const w = window.innerWidth;
      if (w < 400) setColumns(2);
      else if (w < 640) setColumns(3);
      else if (w < 1024) setColumns(4);
      else if (w < 1280) setColumns(5);
      else setColumns(6);
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const totalRows = Math.ceil(channels.length / columns);

  const rowVirtualizer = useVirtualizer({
    count: totalRows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => window.innerWidth < 640 ? 140 : 180,
    overscan: 3,
  });

  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <span className="text-4xl sm:text-6xl mb-4">📺</span>
        <h3 className="text-sm sm:text-lg font-medium text-gray-400">Kanal bulunamadı</h3>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">Farklı bir kategori seçin.</p>
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-[calc(100vh-180px)] overflow-auto">
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
                className="grid gap-1.5 sm:gap-2 p-1.5 sm:p-2"
                style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
              >
                <AnimatePresence mode="popLayout">
                  {rowChannels.map((channel) => (
                    <motion.div
                      key={channel.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
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
