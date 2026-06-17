'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
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
import type { Channel } from '@/types';

export default function LiveTVPage() {
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
    username,
    password,
  } = useStore();

  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);
  const [error, setError] = useState('');
  const [debug, setDebug] = useState('');

  // Sayfa yüklendiğinde kanalları getir
  useEffect(() => {
    fetchChannels();
    loadFavorites();
  }, []);

  const fetchChannels = async () => {
    if (!username || !password) {
      setError('Kullanıcı bilgisi bulunamadı');
      setIsLoadingChannels(false);
      return;
    }

    try {
      setIsLoadingChannels(true);
      setError('');
      setDebug('M3U çekiliyor...');

      const apiUrl = `https://mutlu-iptv.vercel.app/api/m3u?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
      setDebug(`API: ${apiUrl}`);
      
      const response = await fetch(apiUrl, { cache: 'no-store' });
      
      if (!response.ok) {
        throw new Error(`API hatası: ${response.status}`);
      }

      const m3uContent = await response.text();
      setDebug(`M3U alındı: ${m3uContent.substring(0, 100)}...`);
      
      const parser = M3UParser.getInstance();
      const parsedChannels = parser.parse(m3uContent);
      
      setDebug(`Parse edildi: ${parsedChannels.length} kanal bulundu`);
      
      if (parsedChannels.length === 0) {
        setError('Hiç kanal bulunamadı. M3U içeriği boş olabilir.');
      } else {
        setChannels(parsedChannels);
        setFilteredChannels(parsedChannels);
        setDebug(`✅ ${parsedChannels.length} kanal yüklendi`);
      }
      
    } catch (err: any) {
      setError(`Hata: ${err.message}`);
      setDebug(`Hata: ${err.message}`);
    } finally {
      setIsLoadingChannels(false);
    }
  };

  const loadFavorites = async () => {
    if (!userId) return;
    try {
      const favList = await FirebaseService.getFavorites(userId);
      setFavorites(new Set(favList.map(f => f.channelId)));
    } catch (err) {
      console.error('Favori yükleme hatası:', err);
    }
  };

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

  const handleChannelSelect = useCallback(async (channel: Channel) => {
    setCurrentChannel(channel);
    setShowPlayer(true);
    if (userId) {
      await FirebaseService.addRecentWatch(userId, channel);
    }
  }, [userId]);

  const categoryChannels = useMemo(() => {
    let result = searchQuery ? filteredChannels : channels;
    
    if (activeCategory !== 'all') {
      const category = CATEGORIES.find(c => c.id === activeCategory);
      if (category) {
        const catName = category.name.toLowerCase();
        result = result.filter(channel => {
          const group = (channel.group || '').toLowerCase();
          return group.includes(catName) || group.includes(activeCategory);
        });
      }
    }
    
    return result;
  }, [channels, filteredChannels, activeCategory, searchQuery]);

  const handleBackFromPlayer = () => {
    setShowPlayer(false);
    setCurrentChannel(null);
  };

  // Player açıkken
  if (showPlayer && currentChannel) {
    return (
      <MainLayout>
        <div className="p-4 space-y-4">
          <VideoPlayer onBack={handleBackFromPlayer} />
          {currentChannel.epg && <EPGInfo epg={currentChannel.epg} />}
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{currentChannel.name}</h2>
              <p className="text-sm text-gray-400">{currentChannel.group}</p>
            </div>
            <button
              onClick={() => handleFavoriteToggle(currentChannel)}
              className={`p-3 rounded-xl ${favorites.has(currentChannel.id) ? 'text-red-500 bg-red-500/10' : 'text-gray-400'}`}
            >
              {favorites.has(currentChannel.id) ? '❤️' : '🤍'}
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Kanal listesi
  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="hidden lg:block px-4 pt-4">
          <SearchBar />
        </div>
        
        <CategoryTabs />

        {/* Debug bilgisi */}
        {debug && !error && isLoadingChannels && (
          <div className="mx-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <p className="text-blue-400 text-xs">{debug}</p>
          </div>
        )}

        {error && (
          <div className="mx-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm mb-3">{error}</p>
            {debug && <p className="text-gray-500 text-xs mb-3">{debug}</p>}
            <button onClick={fetchChannels} className="px-4 py-2 bg-blue-500 rounded-lg text-sm">
              Tekrar Dene
            </button>
          </div>
        )}

        {isLoadingChannels ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-gray-500">Kanallar yükleniyor...</p>
            {debug && <p className="text-gray-600 text-xs mt-2">{debug}</p>}
          </div>
        ) : channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="text-6xl mb-4">📡</span>
            <h3 className="text-lg font-medium text-gray-400">Kanal bulunamadı</h3>
            <p className="text-sm text-gray-500 mt-1">M3U listesi boş veya erişilemiyor.</p>
            <button onClick={fetchChannels} className="mt-4 px-6 py-2 bg-blue-500 rounded-xl text-sm">
              Kanalları Yükle
            </button>
          </div>
        ) : (
          <ChannelGrid
            channels={categoryChannels}
            favorites={favorites}
            onChannelSelect={handleChannelSelect}
            onFavoriteToggle={handleFavoriteToggle}
          />
        )}
      </div>
    </MainLayout>
  );
}
