'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';
import { useStore } from '@/store/useStore';
import { FirebaseService } from '@/services/firebase';
import { helpers } from '@/utils/helpers';
import type { RecentWatch, Channel } from '@/types';
import { FiClock, FiPlay, FiTrash2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function RecentPage() {
  const router = useRouter();
  const { userId, setCurrentChannel } = useStore();
  const [recentWatches, setRecentWatches] = useState<RecentWatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadRecentWatches();
    }
  }, [userId]);

  const loadRecentWatches = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const recents = await FirebaseService.getRecentWatches(userId);
      setRecentWatches(recents);
    } catch (err) {
      console.error('Son izlenenler yükleme hatası:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChannelSelect = useCallback(async (channel: Channel) => {
    setCurrentChannel(channel);
    
    if (userId) {
      await FirebaseService.addRecentWatch(userId, channel);
    }
    
    router.push('/live-tv');
  }, [userId, router]);

  const handleClearAll = async () => {
    // Firebase'den tüm son izlenenleri sil
    // Bu fonksiyon Firebase servisine eklenmeli
    setRecentWatches([]);
  };

  return (
    <MainLayout>
      <div className="p-4 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Son İzlenenler</h1>
            <p className="text-gray-400 text-sm mt-1">
              Son izlenen {recentWatches.length} kanal
            </p>
          </div>
          
          {recentWatches.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 
                text-red-400 rounded-xl text-sm transition-colors"
            >
              <FiTrash2 className="w-4 h-4" />
              <span>Tümünü Temizle</span>
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : recentWatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="text-6xl mb-4">🕐</span>
            <h3 className="text-lg font-medium text-gray-400">Henüz izlenen kanal yok</h3>
            <p className="text-sm text-gray-500 mt-1">
              İzlediğiniz kanallar burada görünecek.
            </p>
            <button
              onClick={() => router.push('/live-tv')}
              className="mt-4 px-6 py-2 bg-blue-500 rounded-lg text-sm"
            >
              Kanalları Keşfet
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {recentWatches.map((item, index) => (
                <motion.div
                  key={`${item.channel?.id}-${item.watchedAt}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center space-x-4 p-4 bg-[#1a1a1a] rounded-xl
                    hover:bg-[#252525] transition-colors cursor-pointer group"
                  onClick={() => item.channel && handleChannelSelect(item.channel)}
                >
                  {/* Kanal Logosu */}
                  <div className="w-12 h-12 bg-[#111] rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {item.channel?.logo ? (
                      <img
                        src={item.channel.logo}
                        alt={item.channel.name}
                        className="w-10 h-10 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-lg font-bold text-gray-600">
                        {item.channel?.name?.charAt(0)?.toUpperCase() || '📺'}
                      </span>
                    )}
                  </div>

                  {/* Kanal Bilgisi */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">
                      {item.channel?.name || 'Bilinmeyen Kanal'}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center mt-0.5">
                      <FiClock className="w-3 h-3 mr-1" />
                      {helpers.formatDate(item.watchedAt)}
                    </p>
                  </div>

                  {/* Oynat Butonu */}
                  <button className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 
                    rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    <FiPlay className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
