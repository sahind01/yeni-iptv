'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';
import ChannelGrid from '@/components/Channel/ChannelGrid';
import CategoryTabs from '@/components/UI/CategoryTabs';
import SearchBar from '@/components/UI/SearchBar';
import VideoPlayer from '@/components/Player/VideoPlayer';
import EPGInfo from '@/components/Channel/EPGInfo';
import { useStore } from '@/store/useStore';
import { FirebaseService } from '@/services/firebase';
import { M3UParser } from '@/services/m3u-parser';
import { CATEGORIES } from '@/utils/constants';
import { helpers } from '@/utils/helpers';
import type { Channel } from '@/types';

export default function LiveTVPage() {
  const router = useRouter();
  const { 
    channels, 
    setChannels, 
    filteredChannels, 
    setFilteredChannels,
    currentChannel,
    setCurrentChannel,
    activeCategory,
    searchQuery,
    userId,
    site,
    setLoading,
  } = useStore();

  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);
  const [playerChannel, setPlayerChannel] = useState<Channel | null>(null);
  const [error, setError] = useState('');

  // Kanalları yükle
  useEffect(() => {
    loadChannels();
    loadFavorites();
  }, []);

  const loadChannels = async () => {
    try {
      setIsLoadingChannels(true);
      setError('');

      // Store'dan kullanıcı bilgilerini al
      const state = useStore.getState();
      
      // API'den M3U listesini çek
      const parser = M3UParser.getInstance();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_M3U_API_URL}?username=${state.username}&password=${state.site}`,
        { cache: 'no-store' }
      );

      if (!response.ok) {
        throw new Error('Kanal listesi yüklenemedi');
      }

      const m3uContent = await response.text();
      const channelList = parser.parse(m3uContent);
      
      setChannels(channelList);
      setFilteredChannels(channelList);
      
    } catch (err: any) {
      setError(err.message || 'Kanallar yüklenirken bir hata oluştu');
      console.error('Kanal yükleme hatası:', err);
    } finally {
      setIsLoadingChannels(false);
    }
  };

  // Favorileri yükle
  const loadFavorites = async () => {
    if (!userId) return;
    try {
      const favList = await FirebaseService.getFavorites(userId);
      const favSet = new Set(favList.map(f => f.channelId));
      setFavorites(favSet);
    } catch (err) {
      console.error('Favori yükleme hatası:', err);
    }
  };

  // Favori ekle/çıkar
  const handleFavoriteToggle = useCallback(async (channel: Channel) => {
    if (!userId) return;

    try {
      const isFav = favorites.has(channel.id);
      
      if (isFav) {
        await FirebaseService.removeFromFavorites(userId, channel.id);
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(channel.id);
          return next;
        });
      } else {
        await FirebaseService.addToFavorites(userId, channel);
        setFavorites(prev => new Set(prev).add(channel.id));
      }
    } catch (err) {
      console.error('Favori işlemi hatası:', err);
    }
  }, [userId, favorites]);

  // Kanal seçme
  const handleChannelSelect = useCallback(async (channel: Channel) => {
    setPlayerChannel(channel);
    setCurrentChannel(channel);
    setShowPlayer(true);

    // Son izlenenlere ekle
    if (userId) {
      try {
        await FirebaseService.addRecentWatch(userId, channel);
      } catch (err) {
        console.error('Son izlenen ekleme hatası:', err);
      }
    }
  }, [userId]);

  // Kategorilere göre filtrele
  const categoryChannels = useMemo(() => {
    let result = filteredChannels.length > 0 || searchQuery 
      ? filteredChannels 
      : channels;

    if (activeCategory !== 'all') {
      const category = CATEGORIES.find(c => c.id === activeCategory);
      if (category) {
        const categoryName = category.name;
        result = result.filter(channel => {
          const group = channel.group?.toLowerCase() || '';
          return group.includes(categoryName.toLowerCase()) ||
                 group.includes(category.id);
        });
      }
    }

    return result;
  }, [channels, filteredChannels, activeCategory, searchQuery]);

  // Player'dan geri dön
  const handleBackFromPlayer = () => {
    setShowPlayer(false);
    setPlayerChannel(null);
    setCurrentChannel(null);
  };

  // Yeniden yükle
  const handleRetry = () => {
    loadChannels();
  };

  return (
    <MainLayout>
      <div className="h-full">
        {showPlayer && playerChannel ? (
          /* Player Görünümü */
          <div className="p-4 space-y-4">
            <VideoPlayer onBack={handleBackFromPlayer} />
            
            {/* EPG Bilgisi */}
            {playerChannel.epg && (
              <EPGInfo epg={playerChannel.epg} />
            )}
            
            {/* Kanal Bilgisi */}
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <h2 className="text-lg font-semibold">{playerChannel.name}</h2>
                <p className="text-sm text-gray-400">{playerChannel.group}</p>
              </div>
              <button
                onClick={() => handleFavoriteToggle(playerChannel)}
                className={`p-3 rounded-xl transition-colors ${
                  favorites.has(playerChannel.id)
                    ? 'text-red-500 bg-red-500/10'
                    : 'text-gray-400 hover:text-red-500'
                }`}
              >
                {favorites.has(playerChannel.id) ? '❤️' : '🤍'}
              </button>
            </div>
          </div>
        ) : (
          /* Kanal Listesi Görünümü */
          <div className="space-y-4">
            {/* Arama (Masaüstü) */}
            <div className="hidden lg:block px-4 pt-4">
              <SearchBar />
            </div>

            {/* Kategoriler */}
            <CategoryTabs />

            {/* Hata Durumu */}
            {error && (
              <div className="mx-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-sm mb-3">{error}</p>
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
                >
                  Tekrar Dene
                </button>
              </div>
            )}

            {/* Yükleniyor */}
            {isLoadingChannels ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
                <p className="text-gray-500">Kanallar yükleniyor...</p>
              </div>
            ) : (
              /* Kanal Grid */
              <ChannelGrid
                channels={categoryChannels}
                favorites={favorites}
                onChannelSelect={handleChannelSelect}
                onFavoriteToggle={handleFavoriteToggle}
              />
            )}

            {/* Boş Durum */}
            {!isLoadingChannels && categoryChannels.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center py-20">
                <span className="text-6xl mb-4">📡</span>
                <h3 className="text-lg font-medium text-gray-400">
                  {searchQuery ? 'Aramanızla eşleşen kanal bulunamadı' : 'Bu kategoride kanal bulunamadı'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Farklı bir arama terimi deneyin veya kategoriyi değiştirin.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
