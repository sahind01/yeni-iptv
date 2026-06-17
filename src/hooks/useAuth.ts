'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FirebaseService } from '@/services/firebase';
import { useStore } from '@/store/useStore';
import { M3UParser } from '@/services/m3u-parser';

export function useAuth() {
  const router = useRouter();
  const { login, logout: storeLogout, setChannels, setLoading, setAuthReady } = useStore();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = useCallback(async (site: string, username: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const userId = await FirebaseService.loginUser(site, username, password);
      login(userId, username, site);
      setAuthReady(true);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    storeLogout();
    setAuthReady(true);
    router.push('/login');
  }, []);

  const loadChannels = useCallback(async (username: string, password: string) => {
    setLoading(true);
    try {
      const parser = M3UParser.getInstance();
      const channels = await parser.fetchPlaylist(username, password);
      setChannels(channels);
      return channels;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    error,
    login: handleLogin,
    logout: handleLogout,
    loadChannels,
  };
}
