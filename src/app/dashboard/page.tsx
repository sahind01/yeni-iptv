'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiTv, FiHeart, FiClock, FiCalendar, FiAlertCircle } from 'react-icons/fi';
import MainLayout from '@/components/Layout/MainLayout';
import { useStore } from '@/store/useStore';
import { FirebaseService } from '@/services/firebase';

export default function DashboardPage() {
  const { userId, channels } = useStore();
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [recentCount, setRecentCount] = useState(0);
  const [userExpiry, setUserExpiry] = useState<{ startDate: number; expiryDate: number } | null>(null);
  const [daysLeft, setDaysLeft] = useState(0);
  const [loadingExpiry, setLoadingExpiry] = useState(true);

  useEffect(() => {
    if (userId) {
      loadStats();
      loadExpiry();
    }
  }, [userId]);

  const loadStats = async () => {
    if (!userId) return;
    const favorites = await FirebaseService.getFavorites(userId);
    const recents = await FirebaseService.getRecentWatches(userId);
    setFavoriteCount(favorites.length);
    setRecentCount(recents.length);
  };

  const loadExpiry = async () => {
    if (!userId) return;
    setLoadingExpiry(true);
    
    // Önce varolan süreyi kontrol et
    let expiry = await FirebaseService.getUserExpiry(userId);
    
    // Süre yoksa otomatik oluştur (ilk giriş)
    if (!expiry) {
      const now = Date.now();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      await FirebaseService.setUserExpiry(userId, now, now + thirtyDays);
      expiry = { startDate: now, expiryDate: now + thirtyDays };
    }
    
    setUserExpiry(expiry);
    const now = Date.now();
    const remaining = Math.ceil((expiry.expiryDate - now) / (1000 * 60 * 60 * 24));
    setDaysLeft(remaining > 0 ? remaining : 0);
    setLoadingExpiry(false);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const stats = [
    { id: 'channels', label: 'Toplam Kanal', value: channels.length, icon: FiTv, color: 'from-blue-500 to-blue-600' },
    { id: 'favorites', label: 'Favoriler', value: favoriteCount, icon: FiHeart, color: 'from-red-500 to-pink-600' },
    { id: 'recent', label: 'Son İzlenenler', value: recentCount, icon: FiClock, color: 'from-green-500 to-emerald-600' },
  ];

  return (
    <MainLayout>
      <div className="p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 text-white">Dashboard</h1>

        {/* Süre Bilgisi Kartı */}
        {!loadingExpiry && userExpiry && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-5 rounded-xl border border-gray-700 bg-[#1a1a1a]"
            style={{
              borderLeftWidth: '4px',
              borderLeftColor: daysLeft <= 3 ? '#ef4444' : daysLeft <= 7 ? '#eab308' : '#22c55e',
            }}
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: daysLeft <= 3 ? 'rgba(239,68,68,0.1)' : daysLeft <= 7 ? 'rgba(234,179,8,0.1)' : 'rgba(34,197,94,0.1)',
                  }}
                >
                  {daysLeft <= 3 ? (
                    <FiAlertCircle className="w-6 h-6 text-red-400" />
                  ) : (
                    <FiCalendar className="w-6 h-6 text-blue-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-400">Kalan Süre</p>
                  <p className="text-2xl font-bold"
                    style={{
                      color: daysLeft <= 3 ? '#f87171' : daysLeft <= 7 ? '#facc15' : '#4ade80',
                    }}
                  >
                    {daysLeft} gün
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Başlangıç</p>
                <p className="text-xs text-gray-300">{formatDate(userExpiry.startDate)}</p>
                <p className="text-xs text-gray-500 mt-1">Bitiş</p>
                <p className="text-xs text-gray-300">{formatDate(userExpiry.expiryDate)}</p>
              </div>
            </div>

            {/* İlerleme çubuğu */}
            <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ 
                  width: `${Math.max(0, Math.min(100, ((Date.now() - userExpiry.startDate) / (userExpiry.expiryDate - userExpiry.startDate)) * 100))}%` 
                }}
                className="h-full rounded-full"
                style={{
                  backgroundColor: daysLeft <= 3 ? '#ef4444' : daysLeft <= 7 ? '#eab308' : '#22c55e',
                }}
              />
            </div>
          </motion.div>
        )}

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-xl border border-gray-700 bg-[#1a1a1a]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1 text-white">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="p-6 rounded-xl border border-gray-700 bg-[#1a1a1a]">
          <h2 className="text-lg font-semibold mb-2 text-white">Hoş Geldiniz</h2>
          <p className="text-gray-400 text-sm">
            Mutlu Player ile en iyi IPTV deneyimini yaşayın.
            Kanal listesini görüntülemek için menüden Canlı TV'yi seçin.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
