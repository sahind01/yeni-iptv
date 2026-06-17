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
import type { Channel } from '@/types';

export default function LiveTVPage() {
  const store = useStore();
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
  } = store;

  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    fetchChannels();
    loadFavorites();
  }, []);

  const fetchChannels = async () => {
    const currentState = useStore.getState();
    const user = currentState.username;
    const pass = currentState.password;
    
    if (!user || !pass) {
      setError(`Kullanıcı bilgisi eksik. Lütfen tekrar giriş yapın.`);
      setIsLoadingChannels(false);
      return;
    }

    try {
      setIsLoadingChannels(true);
      setError('');

      const apiUrl = `https://mutlu-iptv.vercel.app/api/m3u?username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}`;
      const response = await fetch(apiUrl, { cache: 'no-store' });
      
      if (!response.ok) {
        throw new Error(`API hatası: ${response.status}`);
      }

      const m3uContent = await response.text();
      const parser = M3UParser.getInstance();
      const parsedChannels = parser.parse(m3uContent);
      
      if (parsedChannels.length === 0) {
        setError('Hiç kanal bulunamadı');
      } else {
        setChannels(parsedChannels);
        setFilteredChannels(parsedChannels);
        setDebugInfo(`${parsedChannels.length} kanal yüklendi ✅`);
      }
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingChannels(false);
    }
  };

  const loadFavorites = async () => {
    const uid = useStore.getState().userId;
    if (!uid) return;
    try {
      const favList = await FirebaseService.getFavorites(uid);
      setFavorites(new Set(favList.map(f => f.channelId)));
    } catch (err) {
      console.error('Favori yükleme hatası:', err);
    }
  };

  const handleFavoriteToggle = useCallback(async (channel: Channel) => {
    const uid = useStore.getState().userId;
    if (!uid) return;
    try {
      const isFav = favorites.has(channel.id);
      if (isFav) {
        await FirebaseService.removeFromFavorites(uid, channel.id);
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(channel.id);
          return next;
        });
      } else {
        await FirebaseService.addToFavorites(uid, channel);
        setFavorites(prev => new Set(prev).add(channel.id));
      }
    } catch (err) {
      console.error('Favori işlemi hatası:', err);
    }
  }, [favorites]);

  const handleChannelSelect = useCallback(async (channel: Channel) => {
    setCurrentChannel(channel);
    setShowPlayer(true);
    const uid = useStore.getState().userId;
    if (uid) {
      await FirebaseService.addRecentWatch(uid, channel);
    }
  }, []);

  // Arama filtresi
  const searchFilteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return channels;
    const query = searchQuery.toLowerCase().trim();
    return channels.filter(ch => 
      ch.name.toLowerCase().includes(query) ||
      (ch.group || '').toLowerCase().includes(query)
    );
  }, [channels, searchQuery]);

  // Kategori filtresi
  const categoryChannels = useMemo(() => {
    let result = searchFilteredChannels;

    if (activeCategory && activeCategory !== 'all') {
      result = result.filter(channel => {
        const groupKey = (channel.group || 'diger').toLowerCase().replace(/\s+/g, '_');
        return groupKey === activeCategory;
      });
    }

    return result;
  }, [searchFilteredChannels, activeCategory]);

  const handleBackFromPlayer = () => {
    setShowPlayer(false);
    setCurrentChannel(null);
  };

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
              className={`p-3 rounded-xl text-xl ${favorites.has(currentChannel.id) ? 'text-red-500' : 'text-gray-500'}`}
            >
              {favorites.has(currentChannel.id) ? '❤️' : '🤍'}
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-2">
        <div className="hidden lg:block px-4 pt-4">
          <SearchBar />
        </div>
        
        <CategoryTabs />

        {debugInfo && !error && (
          <div className="mx-4 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-400 text-xs">{debugInfo}</p>
          </div>
        )}

        {error && (
          <div className="mx-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm mb-3">{error}</p>
            <button onClick={fetchChannels} className="px-4 py-2 bg-blue-500 rounded-lg text-sm">
              Tekrar Dene
            </button>
          </div>
        )}

        {isLoadingChannels ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-gray-500">Kanallar yükleniyor...</p>
          </div>
        ) : channels.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="text-6xl mb-4">📡</span>
            <h3 className="text-lg font-medium text-gray-400">Kanal bulunamadı</h3>
            <button onClick={fetchChannels} className="mt-4 px-6 py-2 bg-blue-500 rounded-xl text-sm">
              Kanalları Yükle
            </button>
          </div>
        ) : (
          <>
            {categoryChannels.length === 0 && searchQuery && (
              <div className="text-center py-8">
                <p className="text-gray-500">"{searchQuery}" için sonuç bulunamadı</p>
              </div>
            )}
            <ChannelGrid
              channels={categoryChannels}
              favorites={favorites}
              onChannelSelect={handleChannelSelect}
              onFavoriteToggle={handleFavoriteToggle}
            />
          </>
        )}
      </div>
    </MainLayout>
  );
}
