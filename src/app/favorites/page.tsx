'use client';

import { useEffect, useState, useCallback } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import ChannelGrid from '@/components/Channel/ChannelGrid';
import { useStore } from '@/store/useStore';
import { FirebaseService } from '@/services/firebase';
import type { Channel, Favorite } from '@/types';
import { useRouter } from 'next/navigation';

export default function FavoritesPage() {
  const router = useRouter();
  const { userId, setCurrentChannel } = useStore();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userId) {
      loadFavorites();
    }
  }, [userId]);

  const loadFavorites = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      setError('');
      
      const favList = await FirebaseService.getFavorites(userId);
      setFavorites(favList);
      setFavoriteIds(new Set(favList.map(f => f.channelId)));
    } catch (err) {
      console.error('Favori yükleme hatası:', err);
      setError('Favoriler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFavoriteToggle = useCallback(async (channel: Channel) => {
    if (!userId) return;

    try {
      await FirebaseService.removeFromFavorites(userId, channel.id);
      setFavorites(prev => prev.filter(f => f.channelId !== channel.id));
      setFavoriteIds(prev => {
        const next = new Set(prev);
        next.delete(channel.id);
        return next;
      });
    } catch (err) {
      console.error('Favori silme hatası:', err);
    }
  }, [userId]);

  const handleChannelSelect = useCallback(async (channel: Channel) => {
    setCurrentChannel(channel);
    
    if (userId) {
      await FirebaseService.addRecentWatch(userId, channel);
    }
    
    router.push('/live-tv');
  }, [userId, router]);

  // Favori kanalları Channel formatına dönüştür
  const favoriteChannels: Channel[] = favorites
    .filter(f => f.channel)
    .map(f => ({
      ...f.channel,
      url: '', // URL burada olmayacak, player'da M3U'dan alınacak
    }));

  return (
    <MainLayout>
      <div className="p-4 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Favoriler</h1>
          <p className="text-gray-400 text-sm mt-1">
            {favorites.length} favori kanal
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-gray-500">Favoriler yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400 mb-3">{error}</p>
            <button
              onClick={loadFavorites}
              className="px-4 py-2 bg-blue-500 rounded-lg text-sm"
            >
              Tekrar Dene
            </button>
          </div>
        ) : favoriteChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="text-6xl mb-4">🤍</span>
            <h3 className="text-lg font-medium text-gray-400">Henüz favori yok</h3>
            <p className="text-sm text-gray-500 mt-1">
              Kanal kartındaki kalp ikonuna tıklayarak favorilere ekleyebilirsiniz.
            </p>
            <button
              onClick={() => router.push('/live-tv')}
              className="mt-4 px-6 py-2 bg-blue-500 rounded-lg text-sm"
            >
              Kanalları Keşfet
            </button>
          </div>
        ) : (
          <ChannelGrid
            channels={favoriteChannels}
            favorites={favoriteIds}
            onChannelSelect={handleChannelSelect}
            onFavoriteToggle={handleFavoriteToggle}
          />
        )}
      </div>
    </MainLayout>
  );
}
