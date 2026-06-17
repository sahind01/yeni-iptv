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
    setLoading,
  } = useStore();

  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [error, setError] = useState('');

  // Kanalları yükle
  useEffect(() => {
    if (channels.length === 0 && username && password) {
      loadChannels();
    } else if (channels.length > 0) {
      setFilteredChannels(channels);
    }
    loadFavorites();
  }, []);

  const loadChannels = async () => {
    if (!username || !password) return;
    
    try {
      setIsLoadingChannels(true);
      setError('');
      
      const parser = M3UParser.getInstance();
      const channelList = await parser.fetchPlaylist(username, password);
      
      setChannels(channelList);
      setFilteredChannels(channelList);
      
    } catch (err: any) {
      setError(err.message || 'Kanallar yüklenemedi');
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

        {error && (
          <div className="mx-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm mb-3">{error}</p>
            <button onClick={loadChannels} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm">
              Tekrar Dene
            </button>
          </div>
        )}

        {isLoadingChannels ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-gray-500">Kanallar yükleniyor...</p>
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
