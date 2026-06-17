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
    console.log('LiveTV mounted. Store state:', {
      username,
      password: password ? '***var***' : 'YOK',
      channels: channels.length,
      isAuthenticated: store.isAuthenticated,
    });
    
    fetchChannels();
    loadFavorites();
  }, []);

  const fetchChannels = async () => {
    // Store'dan güncel değerleri al
    const currentState = useStore.getState();
    const user = currentState.username;
    const pass = currentState.password;
    
    console.log('fetchChannels - user:', user, 'pass var mı:', !!pass);
    
    if (!user || !pass) {
      setError(`Kullanıcı bilgisi eksik. Kullanıcı: ${user || 'YOK'}, Şifre: ${pass ? 'VAR' : 'YOK'}`);
      setIsLoadingChannels(false);
      return;
    }

    try {
      setIsLoadingChannels(true);
      setError('');
      setDebugInfo('API çağrılıyor...');

      const apiUrl = `https://mutlu-iptv.vercel.app/api/m3u?username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}`;
      console.log('API URL:', apiUrl);
      
      const response = await fetch(apiUrl, { cache: 'no-store' });
      console.log('API Status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API hatası: ${response.status}`);
      }

      const m3uContent = await response.text();
      console.log('M3U length:', m3uContent.length);
      
      const parser = M3UParser.getInstance();
      const parsedChannels = parser.parse(m3uContent);
      
      console.log('Parsed channels:', parsedChannels.length);
      
      if (parsedChannels.length === 0) {
        setError('Hiç kanal bulunamadı');
      } else {
        setChannels(parsedChannels);
        setFilteredChannels(parsedChannels);
        setDebugInfo(`${parsedChannels.length} kanal yüklendi ✅`);
      }
      
    } catch (err: any) {
      console.error('Fetch error:', err);
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

  if (showPlayer && currentChannel) {
    return (
      <MainLayout>
        <div className="p-4 space-y-4">
          <VideoPlayer onBack={handleBackFromPlayer} />
          {currentChannel.epg && <EPGInfo epg={currentChannel.epg} />}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="hidden lg:block px-4 pt-4">
          <SearchBar />
        </div>
        
        <CategoryTabs />

        {/* Debug */}
        {debugInfo && (
          <div className="mx-4 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-400 text-xs">{debugInfo}</p>
          </div>
        )}

        {error && (
          <div className="mx-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm mb-2">{error}</p>
            <p className="text-gray-500 text-xs mb-3">
              Kullanıcı: {username || 'YOK'} | Şifre: {password ? '****' : 'YOK'}
            </p>
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
            <h3 className="text-lg font-medium text-gray-400">Kanal yok</h3>
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
