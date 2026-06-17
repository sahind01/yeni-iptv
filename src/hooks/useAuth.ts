'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FirebaseService } from '@/services/firebase';
import { useStore } from '@/store/useStore';
import { M3UParser } from '@/services/m3u-parser';
import { CryptoUtils } from '@/utils/crypto';

export function useAuth() {
  const router = useRouter();
  const { login, logout, setSessionToken, setChannels, setLoading, setAuthReady } = useStore();
  const [error, setError] = useState<string | null>(null);

  // Auth durumunu dinle
  useEffect(() => {
    const unsubscribe = FirebaseService.onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await FirebaseService.getUserData(firebaseUser.uid);
        if (userData) {
          login(firebaseUser.uid, userData.username, userData.site);
          const sessionToken = CryptoUtils.generateSessionToken(firebaseUser.uid);
          setSessionToken(sessionToken);
        }
      } else {
        logout();
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const register = useCallback(async (
    email: string,
    password: string,
    site: string,
    username: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const user = await FirebaseService.registerUser(email, password, { username, site });
      login(user.uid, username, site);
      setAuthReady(true);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const user = await FirebaseService.loginUser(email, password);
      const userData = await FirebaseService.getUserData(user.uid);
      
      if (!userData) {
        throw new Error('Kullanıcı bilgileri bulunamadı.');
      }
      
      login(user.uid, userData.username, userData.site);
      const sessionToken = CryptoUtils.generateSessionToken(user.uid);
      setSessionToken(sessionToken);
      setAuthReady(true);
      
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await FirebaseService.logoutUser();
      logout();
      setAuthReady(true);
      router.push('/login');
    } catch (err) {
      console.error('Çıkış hatası:', err);
    }
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
    register,
    login: handleLogin,
    logout: handleLogout,
    loadChannels,
  };
}
