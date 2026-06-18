'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiTv, FiHeart, FiClock, FiCalendar, FiAlertCircle, FiPlay, FiFilm, FiMonitor, FiTrendingUp, FiZap, FiStar, FiUsers, FiShield } from 'react-icons/fi';
import MainLayout from '@/components/Layout/MainLayout';
import { useStore } from '@/store/useStore';
import { FirebaseService } from '@/services/firebase';
import { useRouter } from 'next/navigation';
import type { RecentWatch } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const { userId, channels, setCurrentChannel } = useStore();
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [recentCount, setRecentCount] = useState(0);
  const [recentWatches, setRecentWatches] = useState<RecentWatch[]>([]);
  const [expireDate, setExpireDate] = useState<string | null>(null);
  const [daysLeft, setDaysLeft] = useState(0);
  const [loadingExpiry, setLoadingExpiry] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [fakeDeviceCount, setFakeDeviceCount] = useState(1);

  useEffect(() => {
    if (userId) {
      loadAll();
      // Sahte cihaz sayısı - rastgele 1-2 arası
      const rand = Math.random();
      setFakeDeviceCount(rand > 0.7 ? 2 : 1);
    }
    const hour = new Date().getHours();
    if (hour < 6) setGreeting('İyi Geceler');
    else if (hour < 12) setGreeting('Günaydın');
    else if (hour < 18) setGreeting('İyi Günler');
    else setGreeting('İyi Akşamlar');
  }, [userId]);

  const loadAll = async () => {
    if (!userId) return;
    const [favorites, recents] = await Promise.all([
      FirebaseService.getFavorites(userId),
      FirebaseService.getRecentWatches(userId),
    ]);
    setFavoriteCount(favorites.length);
    setRecentCount(recents.length);
    setRecentWatches(recents.slice(0, 5));

    const userData = await FirebaseService.getUserData(userId);
    if (userData?.expireDate) {
      setExpireDate(userData.expireDate);
      const expire = new Date(userData.expireDate).getTime();
      const remaining = Math.ceil((expire - Date.now()) / (1000 * 60 * 60 * 24));
      setDaysLeft(remaining > 0 ? remaining : 0);
    }
    setLoadingExpiry(false);
  };

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch { return dateStr; }
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Az önce';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} dk önce`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} saat önce`;
    return `${Math.floor(diff / 86400000)} gün önce`;
  };

  const handleRecentClick = (item: RecentWatch) => {
    if (item.channel) {
      setCurrentChannel(item.channel);
      router.push('/live-tv');
    }
  };

  const quickActions = [
    { label: 'Canlı TV', icon: FiTv, path: '/live-tv', color: 'from-blue-500 to-blue-600' },
    { label: 'Filmler', icon: FiFilm, path: '/movies', color: 'from-purple-500 to-pink-600' },
    { label: 'Diziler', icon: FiMonitor, path: '/series', color: 'from-orange-500 to-red-600' },
    { label: 'Favoriler', icon: FiHeart, path: '/favorites', color: 'from-red-500 to-pink-600' },
  ];

  return (
    <MainLayout>
      <div className="p-4 lg:p-8 max-w-5xl mx-auto">
        {/* Hoş Geldin */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-white">
            {greeting}, <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">{useStore.getState().username || 'Kullanıcı'}</span> 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">Bugün ne izlemek istersin?</p>
        </motion.div>

        {/* Süre + Cihaz Uyarısı */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {!loadingExpiry && expireDate && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl border border-gray-700 bg-[#1a1a1a] cursor-pointer hover:bg-[#222] transition-all"
              onClick={() => router.push('/settings')}
              style={{ borderLeftWidth: '4px', borderLeftColor: daysLeft <= 3 ? '#ef4444' : daysLeft <= 7 ? '#eab308' : '#22c55e' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: daysLeft <= 3 ? 'rgba(239,68,68,0.1)' : daysLeft <= 7 ? 'rgba(234,179,8,0.1)' : 'rgba(34,197,94,0.1)' }}>
                    {daysLeft <= 3 ? <FiAlertCircle className="w-5 h-5 text-red-400" /> : <FiCalendar className="w-5 h-5 text-blue-400" />}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Kalan Süre</p>
                    <p className="text-xl font-bold" style={{ color: daysLeft <= 3 ? '#f87171' : daysLeft <= 7 ? '#facc15' : '#4ade80' }}>{daysLeft} gün</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500">Bitiş: {formatDate(expireDate)}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Sahte Cihaz Uyarısı */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border bg-[#1a1a1a] cursor-pointer hover:bg-[#222] transition-all ${
              fakeDeviceCount >= 2 ? 'border-red-500/50' : 'border-gray-700'
            }`}
            style={{ borderLeftWidth: '4px', borderLeftColor: fakeDeviceCount >= 2 ? '#ef4444' : '#22c55e' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  fakeDeviceCount >= 2 ? 'bg-red-500/10' : 'bg-green-500/10'
                }`}>
                  {fakeDeviceCount >= 2 ? (
                    <FiAlertCircle className="w-5 h-5 text-red-400" />
                  ) : (
                    <FiUsers className="w-5 h-5 text-green-400" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-400">Aktif Cihaz</p>
                  <p className={`text-xl font-bold ${fakeDeviceCount >= 2 ? 'text-red-400' : 'text-green-400'}`}>
                    {fakeDeviceCount} Cihaz
                  </p>
                </div>
              </div>
              <div className="text-right">
                {fakeDeviceCount >= 2 ? (
                  <p className="text-[10px] text-red-400">⚠️ Hesap paylaşımı tespit edildi!</p>
                ) : (
                  <p className="text-[10px] text-green-400">✅ Güvendesiniz</p>
                )}
              </div>
            </div>
            {fakeDeviceCount >= 2 && (
              <div className="mt-2 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                <p className="text-[10px] text-red-400">
                  🚫 Hesabınız birden fazla cihazda kullanılıyor! Hesap paylaşımı tespit edilirse hesabınız kalıcı olarak kapatılabilir.
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Hızlı Erişim */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => router.push(action.path)}
              className={`p-4 rounded-xl bg-gradient-to-br ${action.color} hover:scale-105 active:scale-95 transition-all`}
            >
              <action.icon className="w-6 h-6 mb-2" />
              <span className="text-sm font-medium">{action.label}</span>
            </motion.button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* İstatistikler */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-xl border border-gray-700 bg-[#1a1a1a] cursor-pointer hover:bg-[#222] transition-all"
            onClick={() => router.push('/live-tv')}>
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <FiTrendingUp className="text-blue-400" /> İstatistikler
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-3 text-center hover:bg-white/10 transition-all">
                <FiTv className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-white">{channels.length}</p>
                <p className="text-[10px] text-gray-500">Kanal</p>
              </div>
              <div onClick={(e) => { e.stopPropagation(); router.push('/favorites'); }} className="bg-white/5 rounded-xl p-3 text-center hover:bg-white/10 transition-all cursor-pointer">
                <FiHeart className="w-5 h-5 text-red-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-white">{favoriteCount}</p>
                <p className="text-[10px] text-gray-500">Favori</p>
              </div>
              <div onClick={(e) => { e.stopPropagation(); router.push('/recent'); }} className="bg-white/5 rounded-xl p-3 text-center hover:bg-white/10 transition-all cursor-pointer">
                <FiClock className="w-5 h-5 text-green-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-white">{recentCount}</p>
                <p className="text-[10px] text-gray-500">İzlenen</p>
              </div>
              <div onClick={(e) => { e.stopPropagation(); router.push('/nasil-kullanilir'); }} className="bg-white/5 rounded-xl p-3 text-center hover:bg-white/10 transition-all cursor-pointer">
                <FiStar className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-white">SSS</p>
                <p className="text-[10px] text-gray-500">Yardım</p>
              </div>
            </div>
          </motion.div>

          {/* Son İzlenenler */}
          <div className="p-5 rounded-xl border border-gray-700 bg-[#1a1a1a]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <FiClock className="text-green-400" /> Son İzlenenler
              </h2>
              {recentCount > 0 && (
                <button onClick={() => router.push('/recent')} className="text-[10px] text-blue-400 hover:text-blue-300">
                  Tümü →
                </button>
              )}
            </div>
            {recentWatches.length === 0 ? (
              <p className="text-gray-500 text-xs">Henüz izlenen kanal yok</p>
            ) : (
              <div className="space-y-2">
                {recentWatches.map((item, index) => (
                  <div 
                    key={index} 
                    onClick={() => handleRecentClick(item)}
                    className="flex items-center space-x-2 p-2 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-all">
                    <div className="w-7 h-7 bg-[#111] rounded flex items-center justify-center flex-shrink-0">
                      {item.channel?.logo ? (
                        <img src={item.channel.logo} alt="" className="w-5 h-5 object-contain" onError={e => (e.target as HTMLImageElement).style.display='none'} />
                      ) : (
                        <FiPlay className="w-3 h-3 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{item.channel?.name || 'Kanal'}</p>
                    </div>
                    <span className="text-[10px] text-gray-500 flex-shrink-0">{formatTimeAgo(item.watchedAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Hızlı İpuçları */}
        <div className="p-5 rounded-xl border border-gray-700 bg-[#1a1a1a]">
          <div className="flex items-center gap-2 mb-3">
            <FiZap className="text-yellow-400" />
            <h2 className="text-sm font-semibold text-white">Hızlı İpuçları</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-400">
            <div onClick={() => router.push('/nasil-kullanilir')} className="bg-white/5 hover:bg-white/10 rounded-lg p-3 cursor-pointer transition-all">
              <p className="text-white font-medium mb-1">📱 Mobil Kullanım</p>
              <p>Tarayıcıdan "Ana Ekrana Ekle" ile uygulama gibi kullanabilirsiniz.</p>
            </div>
            <div onClick={() => router.push('/live-tv')} className="bg-white/5 hover:bg-white/10 rounded-lg p-3 cursor-pointer transition-all">
              <p className="text-white font-medium mb-1">🔍 Hızlı Arama</p>
              <p>Canlı TV'de kanal ismini yazarak anında bulabilirsiniz.</p>
            </div>
            <div onClick={() => router.push('/favorites')} className="bg-white/5 hover:bg-white/10 rounded-lg p-3 cursor-pointer transition-all">
              <p className="text-white font-medium mb-1">❤️ Favoriler</p>
              <p>Kalp ikonuna tıklayarak kanalları favorilere ekleyebilirsiniz.</p>
            </div>
          </div>
        </div>

        {/* Gizlilik Uyarısı */}
        <div className="mt-6 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-start space-x-3">
            <FiShield className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-yellow-400 font-medium mb-1">Güvenlik Uyarısı</p>
              <p className="text-[10px] text-gray-400">
                Bu hesap size özeldir. Hesap bilgilerinizi başkalarıyla paylaşmanız durumunda hesabınız askıya alınabilir veya kalıcı olarak kapatılabilir. Güvenliğiniz için lütfen hesap bilgilerinizi kimseyle paylaşmayın.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
