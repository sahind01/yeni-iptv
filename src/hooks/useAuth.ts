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
      // M3U API kontrolü
      const apiUrl = `https://mutlu-iptv.vercel.app/api/m3u?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error('Kullanıcı adı veya şifre hatalı');
      }

      const m3uContent = await response.text();
      
      if (!m3uContent.includes('#EXTM3U')) {
        throw new Error('Geçersiz M3U yanıtı');
      }

      // Firebase'e kaydet
      const userId = await FirebaseService.loginUser(site, username, password);

      // Kanalları parse et
      const parser = M3UParser.getInstance();
      const channels = parser.parse(m3uContent);
      setChannels(channels);

      // Store'a kaydet (4 parametre)
      login(userId, username, site, password);
      setAuthReady(true);
      router.push('/dashboard');
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [login, setChannels, setLoading, setAuthReady, router]);

  const handleLogout = useCallback(() => {
    storeLogout();
    setAuthReady(true);
    router.push('/login');
  }, [storeLogout, setAuthReady, router]);

  return {
    error,
    login: handleLogin,
    logout: handleLogout,
  };
}
