'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiZap, FiShield, FiMaximize2, FiMinimize2, FiAlertCircle, FiSmartphone, FiLock, FiGift, FiStar } from 'react-icons/fi';
import MainLayout from '@/components/Layout/MainLayout';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const { userId } = useStore();
  const [greeting, setGreeting] = useState('');
  const [iframeFull, setIframeFull] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 6) setGreeting('İyi Geceler');
    else if (hour < 12) setGreeting('Günaydın');
    else if (hour < 18) setGreeting('İyi Günler');
    else setGreeting('İyi Akşamlar');
  }, []);

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

        {/* GÜNÜN MAÇLARI - IFRAME */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚽</span>
              <h2 className="text-sm font-semibold text-white">Günün Maçları</h2>
              <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">CANLI</span>
            </div>
            <button 
              onClick={() => setIframeFull(!iframeFull)} 
              className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
            >
              {iframeFull ? <FiMinimize2 className="w-4 h-4" /> : <FiMaximize2 className="w-4 h-4" />}
            </button>
          </div>
          <div className={`rounded-xl border border-gray-700 overflow-hidden bg-[#111] transition-all duration-300 ${iframeFull ? 'h-[500px] sm:h-[600px]' : 'h-[300px] sm:h-[350px]'}`}>
            <iframe 
              src="https://mutlugunmaci.vercel.app/" 
              className="w-full h-full"
              style={{ border: 'none' }}
              title="Günün Maçları"
              sandbox="allow-scripts allow-same-origin"
              loading="lazy"
            />
          </div>
        </motion.div>

        {/* ÖZELLİK KARTLARI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            onClick={() => router.push('/live-tv')}
            className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 cursor-pointer hover:scale-105 active:scale-95 transition-all">
            <span className="text-3xl">📺</span>
            <h3 className="text-sm font-semibold text-white mt-2">Canlı TV</h3>
            <p className="text-[10px] text-gray-400 mt-1">1000+ kanalı keşfet</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            onClick={() => router.push('/movies')}
            className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/30 cursor-pointer hover:scale-105 active:scale-95 transition-all">
            <span className="text-3xl">🎬</span>
            <h3 className="text-sm font-semibold text-white mt-2">Filmler</h3>
            <p className="text-[10px] text-gray-400 mt-1">Son çıkan filmleri izle</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            onClick={() => router.push('/series')}
            className="p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/30 cursor-pointer hover:scale-105 active:scale-95 transition-all">
            <span className="text-3xl">📱</span>
            <h3 className="text-sm font-semibold text-white mt-2">Diziler</h3>
            <p className="text-[10px] text-gray-400 mt-1">Popüler dizileri takip et</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            onClick={() => router.push('/favorites')}
            className="p-4 rounded-xl bg-gradient-to-br from-red-500/20 to-pink-600/20 border border-red-500/30 cursor-pointer hover:scale-105 active:scale-95 transition-all">
            <span className="text-3xl">❤️</span>
            <h3 className="text-sm font-semibold text-white mt-2">Favoriler</h3>
            <p className="text-[10px] text-gray-400 mt-1">Kaydettiklerine hızlı eriş</p>
          </motion.div>
        </div>

        {/* DUYURU / ÖZEL KART */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="p-4 rounded-xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 cursor-pointer hover:from-yellow-500/20 hover:to-orange-500/20 transition-all"
            onClick={() => window.open('https://t.me/mutluadmin', '_blank')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎁</span>
                <div>
                  <h3 className="text-sm font-semibold text-white">Premium'a Geç!</h3>
                  <p className="text-[11px] text-gray-300 mt-0.5">Daha fazla kanal ve özel içerik için hemen yükselt</p>
                </div>
              </div>
              <div className="bg-yellow-500/20 text-yellow-400 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-yellow-500/30 transition-all">
                İletişim →
              </div>
            </div>
          </div>
        </motion.div>

        {/* ALT BİLGİ KARTLARI */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div onClick={() => window.open('https://t.me/mutluadmin', '_blank')}
            className="p-3 rounded-xl border border-gray-700 bg-[#1a1a1a] hover:bg-[#222] cursor-pointer transition-all">
            <div className="flex items-center gap-2">
              <FiLock className="w-4 h-4 text-blue-400" />
              <p className="text-xs text-white font-medium">Şifre Değiştir</p>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Admin ile iletişime geçerek şifrenizi değiştirin</p>
          </div>

          <div onClick={() => router.push('/nasil-kullanilir')}
            className="p-3 rounded-xl border border-gray-700 bg-[#1a1a1a] hover:bg-[#222] cursor-pointer transition-all">
            <div className="flex items-center gap-2">
              <FiSmartphone className="w-4 h-4 text-green-400" />
              <p className="text-xs text-white font-medium">Mobil Uygulama</p>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Ana ekrana ekleyerek uygulama gibi kullanın</p>
          </div>

          <div onClick={() => router.push('/settings')}
            className="p-3 rounded-xl border border-gray-700 bg-[#1a1a1a] hover:bg-[#222] cursor-pointer transition-all">
            <div className="flex items-center gap-2">
              <FiStar className="w-4 h-4 text-yellow-400" />
              <p className="text-xs text-white font-medium">Ayarlar</p>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Tema, dil ve diğer ayarları düzenleyin</p>
          </div>
        </div>

        {/* Güvenlik Uyarısı */}
        <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-start space-x-3">
            <FiShield className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-yellow-400 font-medium mb-1">Güvenlik Uyarısı</p>
              <p className="text-[10px] text-gray-400">Bu hesap size özeldir. Hesap bilgilerinizi başkalarıyla paylaşmanız durumunda hesabınız askıya alınabilir veya kalıcı olarak kapatılabilir.</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
