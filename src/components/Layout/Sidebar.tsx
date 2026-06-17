'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiHome, FiTv, FiFilm, FiMonitor, 
  FiHeart, FiClock, FiSettings, FiLogOut,
  FiX, FiShield
} from 'react-icons/fi';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: FiHome, path: '/dashboard' },
  { id: 'live-tv', label: 'Canlı TV', icon: FiTv, path: '/live-tv' },
  { id: 'movies', label: 'Filmler', icon: FiFilm, path: '/movies' },
  { id: 'series', label: 'Diziler', icon: FiMonitor, path: '/series' },
  { id: 'favorites', label: 'Favoriler', icon: FiHeart, path: '/favorites' },
  { id: 'recent', label: 'Son İzlenenler', icon: FiClock, path: '/recent' },
  { id: 'adult', label: 'Adult', icon: FiShield, path: '/adult' },
  { id: 'settings', label: 'Ayarlar', icon: FiSettings, path: '/settings' },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, username, site } = useStore();
  const { logout } = useAuth();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Dışarı tıklanınca kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current && 
        !sidebarRef.current.contains(event.target as Node) &&
        sidebarOpen &&
        window.innerWidth < 1024
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen]);

  const handleNavigate = (path: string) => {
    router.push(path);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobil Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        ref={sidebarRef}
        initial={false}
        animate={{ 
          x: sidebarOpen ? 0 : -280,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed left-0 top-0 bottom-0 w-[280px] bg-[#0f0f0f] z-50 
          lg:translate-x-0 lg:static lg:z-auto border-r border-gray-800/50
          flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-800/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-xl">📺</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                Mutlu Player
              </h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Menü */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.path)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl
                    transition-all duration-200 group relative
                    ${isActive 
                      ? 'bg-blue-500/10 text-blue-400' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${
                    isActive ? 'text-blue-400' : 'group-hover:text-white'
                  }`} />
                  <span className="text-sm font-medium">{item.label}</span>
                  
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Kullanıcı Bilgisi & Çıkış */}
        <div className="p-4 border-t border-gray-800/50">
          <div className="flex items-center space-x-3 mb-3 p-3 bg-white/5 rounded-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold">
                {username?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{username}</p>
              <p className="text-xs text-gray-500 truncate">{site}</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 
              bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl
              transition-colors group"
          >
            <FiLogOut className="w-4 h-4" />
            <span className="text-sm">Çıkış Yap</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
