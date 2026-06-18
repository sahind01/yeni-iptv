'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiHome, FiTv, FiFilm, FiMonitor, 
  FiHeart, FiClock, FiSettings, FiLogOut,
  FiX, FiShield, FiMessageCircle,
  FiInfo, FiLock, FiSend, FiHelpCircle, FiCalendar, FiUser, FiEye, FiEyeOff
} from 'react-icons/fi';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';
import { FirebaseService } from '@/services/firebase';
import { ref, get } from 'firebase/database';
import { db } from '@/services/firebase';

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
  { id: 'telegram', label: 'Telegram Grubu', icon: FiSend, href: 'https://t.me/digitaltivi', external: true },
  { id: 'admin', label: 'Admin İletişim', icon: FiMessageCircle, href: 'https://t.me/mutflixadmin', external: true },
  { id: 'hakkimizda', label: 'Hakkımızda', icon: FiInfo, path: '/hakkimizda' },
  { id: 'gizlilik', label: 'Gizlilik Politikası', icon: FiLock, path: '/gizlilik' },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, username, site, userId } = useStore();
  const { logout } = useAuth();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (showProfile && userId) loadProfileData();
  }, [showProfile, userId]);

  const loadProfileData = async () => {
    if (!userId) return;
    const allUsersRef = ref(db, 'users');
    const allSnap = await get(allUsersRef);
    if (allSnap.exists()) {
      const allUsers = allSnap.val();
      for (const [key, value] of Object.entries(allUsers)) {
        const user = value as any;
        if (user.username === username) {
          setProfileData({ ...user, key });
          break;
        }
      }
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Bilinmiyor';
    try { return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch { return dateStr; }
  };

  const getDaysLeft = (expireDate: string) => {
    if (!expireDate) return 0;
    const expire = new Date(expireDate).getTime();
    const now = Date.now();
    return Math.max(0, Math.ceil((expire - now) / (1000 * 60 * 60 * 24)));
  };

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

  const daysLeft = profileData?.expireDate ? getDaysLeft(profileData.expireDate) : 0;
  const maxViewers = profileData?.maxViewers || 2;
  const isActive = profileData?.status === 'active' || !profileData?.status;

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

        {/* PROFİL ALANI */}
        <div className="p-4 border-t border-gray-800/50">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="w-full flex items-center space-x-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all mb-3"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold">{username?.charAt(0)?.toUpperCase() || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-medium truncate">{username || 'Kullanıcı'}</p>
              <p className="text-[10px] text-gray-500 truncate">{site || 'IPTV'}</p>
            </div>
            <FiUser className="w-4 h-4 text-gray-500 flex-shrink-0" />
          </button>

          {/* PROFİL DETAY POPUP */}
          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#1a1a1a] border border-gray-700 rounded-xl p-4 mb-3"
              >
                {profileData ? (
                  <div className="space-y-2.5">
                    {/* Kullanıcı Adı */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">Kullanıcı</span>
                      <span className="text-[11px] text-white font-medium">{profileData.username}</span>
                    </div>

                    {/* Şifre */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">Şifre</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-white font-medium">
                          {showPassword ? profileData.password : '••••••'}
                        </span>
                        <button onClick={() => setShowPassword(!showPassword)} className="text-gray-500 hover:text-white">
                          {showPassword ? <FiEyeOff className="w-3 h-3" /> : <FiEye className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {/* Max İzleyici */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">Max İzleyici</span>
                      <span className="text-[11px] text-white font-medium">{maxViewers} kişi</span>
                    </div>

                    {/* Durum */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">Durum</span>
                      <span className={`text-[11px] font-medium flex items-center gap-1 ${
                        isActive ? 'text-green-400' : 'text-red-400'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                        {isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>

                    {/* Başlangıç */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">Başlangıç</span>
                      <span className="text-[11px] text-white">{formatDate(profileData.createdAt)}</span>
                    </div>

                    {/* Bitiş */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">Bitiş</span>
                      <span className="text-[11px] text-white">{formatDate(profileData.expireDate)}</span>
                    </div>

                    {/* Kalan Gün */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">Kalan</span>
                      <span className={`text-[11px] font-bold ${
                        daysLeft <= 3 ? 'text-red-400' : daysLeft <= 7 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {daysLeft} gün
                      </span>
                    </div>

                    {/* İlerleme Çubuğu */}
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          daysLeft <= 3 ? 'bg-red-500' : daysLeft <= 7 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, (daysLeft / 30) * 100))}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center py-3">
                    <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors text-sm">
            <FiLogOut className="w-4 h-4" />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
