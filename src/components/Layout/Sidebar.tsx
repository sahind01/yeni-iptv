'use client';

import { useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiHome, FiTv, FiFilm, FiMonitor, 
  FiHeart, FiClock, FiSettings, FiLogOut,
  FiX, FiShield, FiMessageCircle,
  FiInfo, FiLock, FiSend, FiHelpCircle
} from 'react-icons/fi';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';

const menuItems = [
  { id: 'dashboard', label: 'Ana Sayfa', icon: FiHome, path: '/dashboard' },
  { id: 'live-tv', label: 'Canlı TV', icon: FiTv, path: '/live-tv' },
  { id: 'movies', label: 'Filmler', icon: FiFilm, path: '/movies' },
  { id: 'series', label: 'Diziler', icon: FiMonitor, path: '/series' },
  { id: 'favorites', label: 'Favoriler', icon: FiHeart, path: '/favorites' },
  { id: 'recent', label: 'Son İzlenenler', icon: FiClock, path: '/recent' },
  { id: 'adult', label: 'Adult', icon: FiShield, path: '/adult' },
  { id: 'settings', label: 'Ayarlar', icon: FiSettings, path: '/settings' },
];

const extraLinks = [
  { id: 'nasil', label: 'Nasıl Kullanılır?', icon: FiHelpCircle, path: '/nasil-kullanilir' },
  { id: 'telegram', label: 'Telegram Grubu', icon: FiSend, href: 'https://t.me/mutluiptv', external: true },
  { id: 'admin', label: 'Admin İletişim', icon: FiMessageCircle, href: 'https://t.me/mutluadmin', external: true },
  { id: 'hakkimizda', label: 'Hakkımızda', icon: FiInfo, path: '/hakkimizda' },
  { id: 'gizlilik', label: 'Gizlilik Politikası', icon: FiLock, path: '/gizlilik' },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, username, site } = useStore();
  const { logout } = useAuth();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleNavigate = (path: string) => {
    router.push(path);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleExternalLink = (href: string) => {
    window.open(href, '_blank');
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setSidebarOpen(false);
  };

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        ref={sidebarRef}
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed left-0 top-0 bottom-0 w-[280px] bg-[#0f0f0f] z-50 
          lg:translate-x-0 lg:static lg:z-auto border-r border-gray-800/50 flex flex-col"
      >
        <div className="p-5 border-b border-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-lg">📺</span>
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                Mutlu Player
              </h1>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-white/10 rounded-lg">
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <p className="text-[10px] text-gray-600 uppercase tracking-wider px-3 mb-2">Menü</p>
          <div className="space-y-0.5">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.path)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                    isActive ? 'bg-blue-500/10 text-blue-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-400' : ''}`} />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-gray-600 uppercase tracking-wider px-3 mt-6 mb-2">Linkler</p>
          <div className="space-y-0.5">
            {extraLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => link.external ? handleExternalLink(link.href!) : handleNavigate(link.path!)}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-150"
              >
                <link.icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{link.label}</span>
                {link.external && (
                  <svg className="w-3 h-3 ml-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-800/50">
          <div className="flex items-center space-x-3 mb-3 p-3 bg-white/5 rounded-xl">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold">{username?.charAt(0)?.toUpperCase() || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{username || 'Kullanıcı'}</p>
              <p className="text-[10px] text-gray-500 truncate">{site || 'IPTV'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors text-sm">
            <FiLogOut className="w-4 h-4" />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
