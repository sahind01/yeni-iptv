'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { FirebaseService } from '@/services/firebase';
import { M3UParser } from '@/services/m3u-parser';

export function useAuth() {
  const router = useRouter();
  const { login, logout: storeLogout, setChannels, setLoading, setAuthReady } = useStore();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = useCallback(async (site: string, username: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = `https://mutlu-iptv.vercel.app/api/m3u?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) throw new Error('Kullanıcı adı veya şifre hatalı');

      const m3uContent = await response.text();
      
      if (!m3uContent.includes('#EXTM3U')) throw new Error('Geçersiz M3U yanıtı');

      const parser = M3UParser.getInstance();
      const channels = parser.parse(m3uContent);
      setChannels(channels);

      // userId = direkt username (Firebase'deki key)
      const userId = username;

      // Firebase'den kullanıcıyı kontrol et
      const userData = await FirebaseService.getUserData(userId);

      if (!userData) {
        throw new Error('Kullanıcı bulunamadı. Lütfen admin ile iletişime geçin.');
      }

      if (userData.password !== password) {
        throw new Error('Hatalı şifre');
      }

      if (userData.expireDate) {
        const expire = new Date(userData.expireDate).getTime();
        if (Date.now() > expire) {
          throw new Error('Süreniz dolmuştur. Lütfen admin ile iletişime geçin.');
        }
      }

      await FirebaseService.updateLastLogin(userId);

      login(userId, username, site, password);
      setAuthReady(true);
      router.push('/dashboard');
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = useCallback(() => {
    storeLogout();
    setAuthReady(true);
    router.push('/login');
  }, []);

  return {
    error,
    login: handleLogin,
    logout: handleLogout,
  };
}
