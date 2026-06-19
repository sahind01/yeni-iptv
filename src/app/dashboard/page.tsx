'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiTv, FiHeart, FiClock, FiPlay, FiFilm, FiMonitor, FiTrendingUp, FiZap, FiStar, FiShield } from 'react-icons/fi';
import MainLayout from '@/components/Layout/MainLayout';
import { useStore } from '@/store/useStore';
import { FirebaseService } from '@/services/firebase';
import { useRouter } from 'next/navigation';
import type { RecentWatch } from '@/types';

// Manuel yedek maç listesi
const fallbackMatches = [
  { time: '20:00', league: 'Süper Lig', match: 'Galatasaray - Fenerbahçe', channel: 'beIN Sports 1' },
  { time: '22:00', league: 'Premier Lig', match: 'Arsenal - Chelsea', channel: 'beIN Sports 3' },
  { time: '19:30', league: 'Bundesliga', match: 'Bayern Münih - Dortmund', channel: 'beIN Sports 4' },
];

const featuredSeries = [
  { name: 'Kurtlar Vadisi', episode: 'Yeni Bölüm', channel: 'TRT 1', day: 'Perşembe 20:00' },
  { name: 'Teşkilat', episode: 'Son Bölüm', channel: 'TRT 1', day: 'Pazar 20:00' },
  { name: 'Yalı Çapkını', episode: 'Yeni Sezon', channel: 'Star TV', day: 'Cuma 20:00' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { userId, channels, setCurrentChannel } = useStore();
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [recentCount, setRecentCount] = useState(0);
  const [recentWatches, setRecentWatches] = useState<RecentWatch[]>([]);
  const [recentMovies, setRecentMovies] = useState<RecentWatch[]>([]);
  const [recentSeries, setRecentSeries] = useState<RecentWatch[]>([]);
  const [greeting, setGreeting] = useState('');
  const [matches, setMatches] = useState(fallbackMatches);
  const [matchesLoading, setMatchesLoading] = useState(true);

  useEffect(() => {
    if (userId) loadAll();
    const hour = new Date().getHours();
    if (hour < 6) setGreeting('İyi Geceler');
    else if (hour < 12) setGreeting('Günaydın');
    else if (hour < 18) setGreeting('İyi Günler');
    else setGreeting('İyi Akşamlar');
    fetchMatches();
  }, [userId]);

  // GitHub'dan günün maçlarını çek
  const fetchMatches = async () => {
    try {
      setMatchesLoading(true);
      const res = await fetch('https://raw.githubusercontent.com/sahind01/gunun-maci/refs/heads/main/index.html', { cache: 'no-store' });
      if (!res.ok) throw new Error('Maç verisi alınamadı');
      const html = await res.text();
      
      // HTML'den maç verilerini ayıkla
      const parsed = parseMatchesFromHTML(html);
      if (parsed.length > 0) {
        setMatches(parsed);
      }
    } catch (error) {
      console.log('Maç verisi çekilemedi, yedek liste gösteriliyor');
    } finally {
      setMatchesLoading(false);
    }
  };

  // HTML'den maç bilgilerini çıkar
  const parseMatchesFromHTML = (html: string) => {
    const matches: { time: string; league: string; match: string; channel: string }[] = [];
    
    // HTML'deki tüm satırları tara
    const lines = html.split('\n');
    
    for (const line of lines) {
      // Saat: 20:00, Maç: Takım1 - Takım2, Lig: Süper Lig, Kanal: beIN gibi formatları yakala
      const timeMatch = line.match(/(\d{2}:\d{2})/);
      const teamsMatch = line.match(/([A-Za-zğüşıöçĞÜŞİÖÇ\s]+)\s*[-–]\s*([A-Za-zğüşıöçĞÜŞİÖÇ\s]+)/);
      const leagueMatch = line.match(/(Süper Lig|Premier Lig|Bundesliga|La Liga|Serie A|Ligue 1|Şampiyonlar Ligi|UEFA|TFF\s1\.\sLig|Trendyol)/i);
      const channelMatch = line.match(/(beIN\s*Sports?\s*\d*|TRT\s*\d*|S Sport|S Sport Plus|Tivibu|D Smart|Exxen)/i);
      
      if (timeMatch && teamsMatch) {
        matches.push({
          time: timeMatch[1],
          league: leagueMatch ? leagueMatch[1] : 'Lig',
          match: `${teamsMatch[1].trim()} - ${teamsMatch[2].trim()}`,
          channel: channelMatch ? channelMatch[1] : 'beIN Sports',
        });
      }
    }
    
    return matches.slice(0, 6); // En fazla 6 maç
  };

  const loadAll = async () => {
    if (!userId) return;
    const [favorites, recents] = await Promise.all([
      FirebaseService.getFavorites(userId),
      FirebaseService.getRecentWatches(userId),
    ]);
    setFavoriteCount(favorites.length);
    setRecentCount(recents.length);
    setRecentWatches(recents.slice(0, 5));
    const movies = recents.filter(r => {
      const g = (r.channel?.group || '').toLowerCase();
      return g.includes('film') || g.includes('movie') || g.includes('sinema');
    });
    setRecentMovies(movies.slice(0, 3));
    const series = recents.filter(r => {
      const g = (r.channel?.group || '').toLowerCase();
      return g.includes('dizi') || g.includes('serie') || g.includes('tv') || g.includes('show') || g.includes('sezon') || g.includes('bölüm');
    });
    setRecentSeries(series.slice(0, 3));
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Az önce';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} dk`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} saat`;
    return `${Math.floor(diff / 86400000)} gün`;
  };

  const handleRecentClick = (item: RecentWatch) => {
    if (item.channel) {
      setCurrentChannel(item.channel);
      const g = (item.channel.group || '').toLowerCase();
      if (g.includes('film') || g.includes('movie') || g.includes('sinema')) router.push('/movies');
      else if (g.includes('dizi') || g.includes('serie')) router.push('/series');
      else router.push('/live-tv');
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
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-white">
            {greeting}, <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">{useStore.getState().username || 'Kullanıcı'}</span> 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">Bugün ne izlemek istersin?</p>
        </motion.div>

        {/* GÜNÜN MAÇLARI - GITHUB'DAN CANLI */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-xl border border-gray-700 bg-[#1a1a1a]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚽</span>
              <h2 className="text-sm font-semibold text-white">Günün Maçları</h2>
              <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">CANLI</span>
            </div>
            {matchesLoading && <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />}
          </div>
          <div className="space-y-2">
            {matches.map((match, index) => (
              <div key={index} className="flex items-center justify-between p-2.5 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-all"
                onClick={() => router.push('/live-tv')}>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white font-bold bg-blue-500/20 px-2 py-1 rounded min-w-[45px] text-center">{match.time}</span>
                  <div>
                    <p className="text-xs text-white font-medium">{match.match}</p>
                    <p className="text-[10px] text-gray-500">{match.league}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400">{match.channel}</span>
                  <FiPlay className="w-3 h-3 text-blue-400" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Hızlı Erişim */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {quickActions.map((action, index) => (
            <motion.button key={action.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
              onClick={() => router.push(action.path)} className={`p-4 rounded-xl bg-gradient-to-br ${action.color} hover:scale-105 active:scale-95 transition-all`}>
              <action.icon className="w-6 h-6 mb-2" />
              <span className="text-sm font-medium">{action.label}</span>
            </motion.button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* İstatistikler */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-xl border border-gray-700 bg-[#1a1a1a] cursor-pointer hover:bg-[#222] transition-all"
            onClick={() => router.push('/live-tv')}>
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><FiTrendingUp className="text-blue-400" /> İstatistikler</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-3 text-center hover:bg-white/10 transition-all"><FiTv className="w-5 h-5 text-blue-400 mx-auto mb-1" /><p className="text-lg font-bold text-white">{channels.length}</p><p className="text-[10px] text-gray-500">Kanal</p></div>
              <div onClick={(e) => { e.stopPropagation(); router.push('/favorites'); }} className="bg-white/5 rounded-xl p-3 text-center hover:bg-white/10 transition-all cursor-pointer"><FiHeart className="w-5 h-5 text-red-400 mx-auto mb-1" /><p className="text-lg font-bold text-white">{favoriteCount}</p><p className="text-[10px] text-gray-500">Favori</p></div>
              <div onClick={(e) => { e.stopPropagation(); router.push('/recent'); }} className="bg-white/5 rounded-xl p-3 text-center hover:bg-white/10 transition-all cursor-pointer"><FiClock className="w-5 h-5 text-green-400 mx-auto mb-1" /><p className="text-lg font-bold text-white">{recentCount}</p><p className="text-[10px] text-gray-500">İzlenen</p></div>
              <div onClick={(e) => { e.stopPropagation(); router.push('/nasil-kullanilir'); }} className="bg-white/5 rounded-xl p-3 text-center hover:bg-white/10 transition-all cursor-pointer"><FiStar className="w-5 h-5 text-yellow-400 mx-auto mb-1" /><p className="text-lg font-bold text-white">SSS</p><p className="text-[10px] text-gray-500">Yardım</p></div>
            </div>
          </motion.div>

          {/* Son İzlenenler */}
          <div className="p-5 rounded-xl border border-gray-700 bg-[#1a1a1a]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2"><FiClock className="text-green-400" /> Son İzlenenler</h2>
              {recentCount > 0 && <button onClick={() => router.push('/recent')} className="text-[10px] text-blue-400 hover:text-blue-300">Tümü →</button>}
            </div>
            {recentWatches.length === 0 ? <p className="text-gray-500 text-xs">Henüz izlenen kanal yok</p> : (
              <div className="space-y-3">
                {recentMovies.length > 0 && (
                  <div>
                    <p className="text-[10px] text-gray-500 mb-1.5 flex items-center gap-1"><FiFilm className="w-3 h-3" /> Filmler</p>
                    {recentMovies.map((item, index) => (
                      <div key={index} onClick={() => handleRecentClick(item)} className="flex items-center space-x-2 p-2 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-all mb-1">
                        <div className="w-6 h-6 bg-[#111] rounded flex items-center justify-center flex-shrink-0"><FiFilm className="w-3 h-3 text-purple-400" /></div>
                        <div className="flex-1 min-w-0"><p className="text-xs text-white truncate">{item.channel?.name || 'Film'}</p></div>
                        <span className="text-[10px] text-gray-500 flex-shrink-0">{formatTimeAgo(item.watchedAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {recentSeries.length > 0 && (
                  <div>
                    <p className="text-[10px] text-gray-500 mb-1.5 flex items-center gap-1"><FiMonitor className="w-3 h-3" /> Diziler</p>
                    {recentSeries.map((item, index) => (
                      <div key={index} onClick={() => handleRecentClick(item)} className="flex items-center space-x-2 p-2 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-all mb-1">
                        <div className="w-6 h-6 bg-[#111] rounded flex items-center justify-center flex-shrink-0"><FiMonitor className="w-3 h-3 text-orange-400" /></div>
                        <div className="flex-1 min-w-0"><p className="text-xs text-white truncate">{item.channel?.name || 'Dizi'}</p></div>
                        <span className="text-[10px] text-gray-500 flex-shrink-0">{formatTimeAgo(item.watchedAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* GÜNÜN DİZİLERİ */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-xl border border-gray-700 bg-[#1a1a1a]">
          <div className="flex items-center gap-2 mb-3"><span className="text-lg">📺</span><h2 className="text-sm font-semibold text-white">Bu Haftanın Dizileri</h2></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {featuredSeries.map((series, index) => (
              <div key={index} className="p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-all" onClick={() => router.push('/series')}>
                <p className="text-xs text-white font-medium">{series.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{series.episode}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-gray-500">{series.day}</span>
                  <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">{series.channel}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Hızlı İpuçları */}
        <div className="p-5 rounded-xl border border-gray-700 bg-[#1a1a1a]">
          <div className="flex items-center gap-2 mb-3"><FiZap className="text-yellow-400" /><h2 className="text-sm font-semibold text-white">Hızlı İpuçları</h2></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-400">
            <div onClick={() => router.push('/nasil-kullanilir')} className="bg-white/5 hover:bg-white/10 rounded-lg p-3 cursor-pointer transition-all"><p className="text-white font-medium mb-1">📱 Mobil Kullanım</p><p>Ana ekrana ekleyerek uygulama gibi kullanabilirsiniz.</p></div>
            <div onClick={() => router.push('/live-tv')} className="bg-white/5 hover:bg-white/10 rounded-lg p-3 cursor-pointer transition-all"><p className="text-white font-medium mb-1">🔍 Hızlı Arama</p><p>Kanal ismini yazarak anında bulabilirsiniz.</p></div>
            <div onClick={() => window.open('https://t.me/mutluadmin', '_blank')} className="bg-white/5 hover:bg-white/10 rounded-lg p-3 cursor-pointer transition-all"><p className="text-white font-medium mb-1">🔒 Şifre Değiştir</p><p>Şifre değişikliği için admin ile iletişime geçin.</p></div>
          </div>
        </div>

        {/* Güvenlik Uyarısı */}
        <div className="mt-6 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-start space-x-3"><FiShield className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" /><div><p className="text-xs text-yellow-400 font-medium mb-1">Güvenlik Uyarısı</p><p className="text-[10px] text-gray-400">Bu hesap size özeldir. Hesap bilgilerinizi başkalarıyla paylaşmanız durumunda hesabınız askıya alınabilir veya kalıcı olarak kapatılabilir.</p></div></div>
        </div>
      </div>
    </MainLayout>
  );
}
