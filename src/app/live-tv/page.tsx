'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import ChannelGrid from '@/components/Channel/ChannelGrid';
import ChannelList from '@/components/Channel/ChannelList';
import CategoryTabs from '@/components/UI/CategoryTabs';
import SearchBar from '@/components/UI/SearchBar';
import VideoPlayer from '@/components/Player/VidPlayer';
import EPGInfo from '@/components/Channel/EPGInfo';
import { useStore } from '@/store/useStore';
import { FirebaseService } from '@/services/firebase';
import { M3UParser } from '@/services/m3u-parser';
import { FiGrid, FiList } from 'react-icons/fi';
import { motion } from 'framer-motion';
import type { Channel } from '@/types';

interface IPTVCategory {
  name: string;
  url: string;
}

export default function LiveTVPage() {
  const store = useStore();
  const { 
    channels, setChannels, filteredChannels, setFilteredChannels,
    currentChannel, setCurrentChannel, activeCategory, searchQuery,
    userId, username, password,
  } = store;

  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedIPTV, setSelectedIPTV] = useState<IPTVCategory | null>(null);
  const [iptvCategories, setIptvCategories] = useState<IPTVCategory[]>([]);
  const [showCategories, setShowCategories] = useState(false);

  useEffect(() => {
    // IPTV kategorilerini oluştur
    const cats: IPTVCategory[] = [];
    
    // 1. IPTV her zaman NEXT_PUBLIC_M3U_API_URL'den
    const apiUrl = process.env.NEXT_PUBLIC_M3U_API_URL;
    if (apiUrl) {
      cats.push({ name: 'IPTV 1', url: apiUrl });
    }
    
    // Diğer IPTV'leri .env'den ekle
    const extraCats = process.env.NEXT_PUBLIC_IPTV_KATEGORILER;
    if (extraCats) {
      extraCats.split(',').forEach(c => {
        const [name, url] = c.split('|');
        if (name && url) cats.push({ name: name.trim(), url: url.trim() });
      });
    }
    
    setIptvCategories(cats);
    
    // 2'den fazla kategori varsa seçim ekranını göster, yoksa direkt 1. IPTV'yi yükle
    if (cats.length > 1) {
      setShowCategories(true);
    } else if (cats.length === 1) {
      setSelectedIPTV(cats[0]);
      fetchChannels(cats[0].url);
    } else {
      fetchChannelsFromAPI();
    }
    
    loadFavorites();
  }, []);

  const fetchChannelsFromAPI = async () => {
    const user = username || useStore.getState().username;
    const pass = password || useStore.getState().password;
    if (!user || !pass) { setError('Kullanıcı bilgisi eksik'); setIsLoadingChannels(false); return; }
    try {
      setIsLoadingChannels(true); setError('');
      const apiUrl = `https://mutlu-iptv.vercel.app/api/m3u?username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}`;
      const response = await fetch(apiUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error('API hatası');
      const text = await response.text();
      const parsed = M3UParser.getInstance().parse(text);
      setChannels(parsed); setFilteredChannels(parsed);
    } catch (err: any) { setError(err.message); }
    finally { setIsLoadingChannels(false); }
  };

  const fetchChannels = async (url: string) => {
    try {
      setIsLoadingChannels(true); setError('');
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error('Liste alınamadı');
      const text = await response.text();
      const parsed = M3UParser.getInstance().parse(text);
      setChannels(parsed); setFilteredChannels(parsed);
    } catch (err: any) { setError(err.message); }
    finally { setIsLoadingChannels(false); }
  };

  const loadFavorites = async () => {
    const uid = userId || useStore.getState().userId;
    if (!uid) return;
    try {
      const favList = await FirebaseService.getFavorites(uid);
      setFavorites(new Set(favList.map(f => f.channelId)));
    } catch (err) { console.error(err); }
  };

  const handleFavoriteToggle = useCallback(async (channel: Channel) => {
    const uid = useStore.getState().userId;
    if (!uid) return;
    try {
      if (favorites.has(channel.id)) {
        await FirebaseService.removeFromFavorites(uid, channel.id);
        setFavorites(prev => { const n = new Set(prev); n.delete(channel.id); return n; });
      } else {
        await FirebaseService.addToFavorites(uid, channel);
        setFavorites(prev => new Set(prev).add(channel.id));
      }
    } catch (err) { console.error(err); }
  }, [favorites]);

  const handleChannelSelect = useCallback(async (channel: Channel) => {
    setCurrentChannel(channel); setShowPlayer(true);
    const uid = useStore.getState().userId;
    if (uid) await FirebaseService.addRecentWatch(uid, channel);
  }, []);

  const handleIPTVClick = (cat: IPTVCategory) => {
    setSelectedIPTV(cat);
    setShowCategories(false);
    fetchChannels(cat.url);
  };

  const handleBackToCategories = () => {
    setShowCategories(true);
    setSelectedIPTV(null);
    setChannels([]);
    setFilteredChannels([]);
  };

  const categoryChannels = useMemo(() => {
    let result = searchQuery ? filteredChannels : channels;
    if (activeCategory !== 'all') {
      result = result.filter(c => {
        const gk = (c.group || 'diger').toLowerCase().replace(/\s+/g, '_');
        return gk === activeCategory;
      });
    }
    return result;
  }, [channels, filteredChannels, activeCategory, searchQuery]);

  if (showPlayer && currentChannel) {
    return (
      <MainLayout>
        <div className="p-4 space-y-4">
          <VideoPlayer onBack={() => { setShowPlayer(false); setCurrentChannel(null); }} />
          {currentChannel.epg && <EPGInfo epg={currentChannel.epg} />}
          <div className="flex items-center space-x-3">
            <div className="flex-1"><h2 className="text-lg font-semibold">{currentChannel.name}</h2><p className="text-sm text-gray-400">{currentChannel.group}</p></div>
            <button onClick={() => handleFavoriteToggle(currentChannel)} className={`p-3 rounded-xl text-xl ${favorites.has(currentChannel.id) ? 'text-red-500' : 'text-gray-500'}`}>
              {favorites.has(currentChannel.id) ? '❤️' : '🤍'}
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // IPTV KATEGORİ SEÇİM EKRANI
  if (showCategories && iptvCategories.length > 1) {
    return (
      <MainLayout>
        <div className="p-4">
          <h1 className="text-lg font-bold text-white mb-4 flex items-center gap-2">📺 IPTV Kanalları</h1>
          <p className="text-xs text-gray-400 mb-4">{iptvCategories.length} IPTV listesi mevcut</p>
          <div className="grid grid-cols-2 gap-2">
            {iptvCategories.map((cat, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleIPTVClick(cat)}
                className="aspect-square bg-[#1a1a1a] border border-gray-700/50 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-[#222] active:scale-95 transition-all p-3"
              >
                <span className="text-3xl">📺</span>
                <span className="text-xs font-medium text-white text-center">{cat.name}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  // NORMAL KANAL LİSTESİ
  return (
    <MainLayout>
      <div className="space-y-2">
        <div className="flex items-center space-x-2 px-4 pt-4">
          {iptvCategories.length > 1 && (
            <button onClick={handleBackToCategories} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg flex-shrink-0">
              <span className="text-sm">←</span>
            </button>
          )}
          <div className="flex-1 hidden lg:block">
            <SearchBar />
          </div>
          <div className="flex bg-[#1a1a1a] rounded-lg p-0.5 border border-gray-700/50">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-white'}`}>
              <FiGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-white'}`}>
              <FiList className="w-4 h-4" />
            </button>
          </div>
        </div>

        <CategoryTabs />

        {error && (
          <div className="mx-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
            <button onClick={() => selectedIPTV ? fetchChannels(selectedIPTV.url) : fetchChannelsFromAPI()} className="mt-2 px-4 py-1.5 bg-blue-500 rounded-lg text-xs">Tekrar Dene</button>
          </div>
        )}

        {isLoadingChannels ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>
        ) : (
          viewMode === 'grid' ? (
            <ChannelGrid channels={categoryChannels} favorites={favorites} onChannelSelect={handleChannelSelect} onFavoriteToggle={handleFavoriteToggle} />
          ) : (
            <ChannelList channels={categoryChannels} favorites={favorites} onChannelSelect={handleChannelSelect} onFavoriteToggle={handleFavoriteToggle} />
          )
        )}
      </div>
    </MainLayout>
  );
}
