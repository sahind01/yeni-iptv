'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import SplashScreen from '@/components/UI/SplashScreen';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, isAuthReady } = useStore();

  useEffect(() => {
    if (isAuthReady && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isAuthReady]);

  if (!isAuthReady) {
    return <SplashScreen />;
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
