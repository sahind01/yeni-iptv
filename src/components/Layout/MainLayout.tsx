'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { ref, get } from 'firebase/database';
import { db } from '@/services/firebase';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isAuthReady, userId } = useStore();

  useEffect(() => {
    if (isAuthReady && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthReady, isAuthenticated]);

  // SAYFA YENİLENİNCE CİHAZ KONTROLÜ
  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    if (pathname === '/login') return;

    const checkDevice = async () => {
      const deviceId = localStorage.getItem('mutlu_device_id');
      
      // localStorage kontrolü
      const storedDevice = localStorage.getItem(`mutlu_active_${userId}`);
      const storedTime = localStorage.getItem(`mutlu_active_${userId}_time`);

      if (storedDevice && storedTime && deviceId) {
        const elapsed = Date.now() - parseInt(storedTime);
        // 30 saniyeden yeni kayıt varsa ve farklı cihazsa AT
        if (elapsed < 30000 && storedDevice !== deviceId) {
          // Başka cihaz aktif!
          localStorage.removeItem('mutlu_player_storage');
          window.location.href = 'https://mutlu-iptv.vercel.app';
          return;
        }
      }

      // Firebase kontrolü
      try {
        const deviceRef = ref(db, `activeDevices/${userId}/device`);
        const snap = await get(deviceRef);
        
        if (snap.exists()) {
          const data = snap.val();
          const elapsed = Date.now() - data.timestamp;
          
          if (elapsed < 30000 && data.deviceId !== deviceId) {
            // Başka cihaz Firebase'de aktif
            localStorage.removeItem('mutlu_player_storage');
            window.location.href = 'https://mutlu-iptv.vercel.app';
            return;
          }
        }
      } catch (e) {}

      // Bu cihazı güncelle
      localStorage.setItem(`mutlu_active_${userId}`, deviceId || '');
      localStorage.setItem(`mutlu_active_${userId}_time`, Date.now().toString());
    };

    checkDevice();
  }, [pathname, isAuthenticated, userId]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-h-screen lg:ml-0 pt-14 lg:pt-0 pb-16 lg:pb-0">
          <div className="max-w-[1920px] mx-auto">
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
