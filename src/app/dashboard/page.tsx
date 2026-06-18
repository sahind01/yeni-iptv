'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiTv, FiHeart, FiClock } from 'react-icons/fi';
import MainLayout from '@/components/Layout/MainLayout';
import { useStore } from '@/store/useStore';
import { FirebaseService } from '@/services/firebase';

export default function DashboardPage() {
  const { userId, channels } = useStore();
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [recentCount, setRecentCount] = useState(0);

  useEffect(() => {
    if (userId) {
      loadStats();
    }

    const deviceId = localStorage.getItem('mutlu_device_id');
    const uid = localStorage.getItem('mutlu_user_id');

    const pingInterval = setInterval(() => {
      if (deviceId && uid) {
        FirebaseService.pingDevice(uid, deviceId);
      }
    }, 2 * 60 * 1000);

    return () => clearInterval(pingInterval);
  }, [userId]);

  const loadStats = async () => {
    if (!userId) return;
    const favorites = await FirebaseService.getFavorites(userId);
    const recents = await FirebaseService.getRecentWatches(userId);
    setFavoriteCount(favorites.length);
    setRecentCount(recents.length);
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
