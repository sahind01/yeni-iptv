'use client';

import { useState, useEffect, useCallback } from 'react';
import { FirebaseService } from '@/services/firebase';
import { useStore } from '@/store/useStore';
import type { Channel, Favorite } from '@/types';

export function useFavorites() {
  const { userId } = useStore();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadFavorites();
    }
  }, [userId]);

  const loadFavorites = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const favList = await FirebaseService.getFavorites(userId);
      setFavorites(favList);
      setFavoriteIds(new Set(favList.map(f => f.channelId)));
    } catch (err) {
      console.error('Favori yükleme hatası:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = useCallback(async (channel: Channel) => {
    if (!userId) return;

    try {
      const isFav = favoriteIds.has(channel.id);
      
      if (isFav) {
        await FirebaseService.removeFromFavorites(userId, channel.id);
        setFavorites(prev => prev.filter(f => f.channelId !== channel.id));
        setFavoriteIds(prev => {
          const next = new Set(prev);
          next.delete(channel.id);
          return next;
        });
      } else {
        await FirebaseService.addToFavorites(userId, channel);
        setFavoriteIds(prev => new Set(prev).add(channel.id));
        await loadFavorites(); // Yeniden yükle
      }
    } catch (err) {
      console.error('Favori işlemi hatası:', err);
      throw err;
    }
  }, [userId, favoriteIds]);

  const isFavorite = useCallback((channelId: string) => {
    return favoriteIds.has(channelId);
  }, [favoriteIds]);

  return {
    favorites,
    favoriteIds,
    isLoading,
    toggleFavorite,
    isFavorite,
    refresh: loadFavorites,
  };
}
