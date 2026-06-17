'use client';

import { useState, useEffect, useMemo } from 'react';
import { M3UParser } from '@/services/m3u-parser';
import { useStore } from '@/store/useStore';
import { helpers } from '@/utils/helpers';
import { CATEGORIES } from '@/utils/constants';
import type { Channel } from '@/types';

export function useChannels() {
  const { 
    channels, 
    setChannels, 
    filteredChannels, 
    setFilteredChannels,
    activeCategory,
    searchQuery,
    setLoading,
  } = useStore();
  
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [error, setError] = useState('');

  const loadChannels = async (username: string, password: string) => {
    try {
      setIsLoadingChannels(true);
      setError('');
      
      const parser = M3UParser.getInstance();
      const channelList = await parser.fetchPlaylist(username, password);
      
      setChannels(channelList);
      setFilteredChannels(channelList);
      
    } catch (err: any) {
      setError(err.message || 'Kanallar yüklenemedi');
      console.error('Kanal yükleme hatası:', err);
    } finally {
      setIsLoadingChannels(false);
    }
  };

  // Kategorilere göre filtrelenmiş kanallar
  const categoryChannels = useMemo(() => {
    let result = searchQuery ? filteredChannels : channels;

    if (activeCategory !== 'all') {
      const category = CATEGORIES.find(c => c.id === activeCategory);
      if (category) {
        const categoryName = category.name.toLowerCase();
        result = result.filter(channel => {
          const group = channel.group?.toLowerCase() || '';
          return group.includes(categoryName) || group.includes(activeCategory);
        });
      }
    }

    return result;
  }, [channels, filteredChannels, activeCategory, searchQuery]);

  // Kanal ara
  const searchChannels = (query: string) => {
    const filtered = helpers.filterChannels(channels, query);
    setFilteredChannels(filtered);
  };

  // URL'den kanal bul
  const findChannelByUrl = (url: string): Channel | undefined => {
    return channels.find(c => c.url === url);
  };

  // ID'den kanal bul
  const findChannelById = (id: string): Channel | undefined => {
    return channels.find(c => c.id === id);
  };

  return {
    channels,
    categoryChannels,
    isLoadingChannels,
    error,
    loadChannels,
    searchChannels,
    findChannelByUrl,
    findChannelById,
  };
}
