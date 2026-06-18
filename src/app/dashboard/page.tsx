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

  useEffect(() => {
    if (userId) { loadStats(); loadExpiry(); }
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
    const expiry = await FirebaseService.getUserExpiry(userId);
    if (expiry) {
      setUserExpiry(expiry);
      const now = Date.now();
      const remaining = Math.ceil((expiry.expiryDate - now) / (1000 * 60 * 60 * 24));
      setDaysLeft(remaining > 0 ? remaining : 0);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const stats = [
    { id: 'channels', label: 'Toplam Kanal', value: channels.length, icon: FiTv, color: 'from-blue-500 to-blue-600' },
    { id: 'favorites', label: 'Favoriler', value: favoriteCount, icon: FiHeart, color: 'from-red-500 to-pink-600' },
    { id: 'recent', label: 'Son İzlenenler', value: recentCount, icon: FiClock, color: 'from-green-500 to-emerald-600' },
  ];

  return (
    <MainLayout>
      <div className="p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        {userExpiry && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className={`glass-card p-5 mb-6 border-l-4 ${
              daysLeft <= 3 ? 'border-red-500 bg-red-500/5' : daysLeft <= 7 ? 'border-yellow-500 bg-yellow-500/5' : 'border-green-500 bg-green-500/5'
            }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  daysLeft <= 3 ? 'bg-red-500/10' : daysLeft <= 7 ? 'bg-yellow-500/10' : 'bg-green-500/10'
                }`}>
                  {daysLeft <= 3 ? <FiAlertCircle className="w-6 h-6 text-red-400" /> : <FiCalendar className="w-6 h-6 text-blue-400" />}
                </div>
                <div>
                  <p className="text-sm text-gray-400">Kalan Süre</p>
                  <p className={`text-2xl font-bold ${daysLeft <= 3 ? 'text-red-400' : daysLeft <= 7 ? 'text-yellow-400' : 'text-green-400'}`}>
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
            <div className="mt-3 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, Math.min(100, ((Date.now() - userExpiry.startDate) / (userExpiry.expiryDate - userExpiry.startDate)) * 100))}%` }}
                className={`h-full rounded-full ${daysLeft <= 3 ? 'bg-red-500' : daysLeft <= 7 ? 'bg-yellow-500' : 'bg-green-500'}`}
              />
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div key={stat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-2">Hoş Geldiniz</h2>
          <p className="text-gray-400 text-sm">Mutlu Player ile en iyi IPTV deneyimini yaşayın. Kanal listesini görüntülemek için menüden Canlı TV'yi seçin.</p>
        </div>
      </div>
    </MainLayout>
  );
}
