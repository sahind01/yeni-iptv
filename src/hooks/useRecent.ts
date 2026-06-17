'use client';

import { useState, useEffect, useCallback } from 'react';
import { FirebaseService } from '@/services/firebase';
import { useStore } from '@/store/useStore';
import type { Channel, RecentWatch } from '@/types';

export function useRecent() {
  const { userId } = useStore();
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

  const addRecentWatch = useCallback(async (channel: Channel) => {
    if (!userId) return;

    try {
      await FirebaseService.addRecentWatch(userId, channel);
      
      // State'i güncelle
      setRecentWatches(prev => {
        const filtered = prev.filter(r => r.channel?.id !== channel.id);
        return [{
          userId,
          channel,
          watchedAt: Date.now(),
        }, ...filtered].slice(0, 20);
      });
    } catch (err) {
      console.error('Son izlenen ekleme hatası:', err);
    }
  }, [userId]);

  return {
    recentWatches,
    isLoading,
    addRecentWatch,
    refresh: loadRecentWatches,
  };
}
