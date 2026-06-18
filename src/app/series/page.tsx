'use client';

import { useEffect, useState, useMemo } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import VideoPlayer from '@/components/Player/VideoPlayer';
import { useStore } from '@/store/useStore';
import { FiMonitor, FiSearch, FiX, FiPlay, FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

interface Episode {
  id: string;
  name: string;
  url: string;
}

interface SeriesGroup {
  name: string;
  episodes: Episode[];
  group: string;
}

export default function SeriesPage() {
  const [seriesGroups, setSeriesGroups] = useState<SeriesGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<SeriesGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeries, setSelectedSeries] = useState<SeriesGroup | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const { setCurrentChannel } = useStore();

  useEffect(() => { fetchSeries(); }, []);

  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    setFilteredGroups(q ? seriesGroups.filter(g => g.name.toLowerCase().includes(q)) : seriesGroups);
  }, [searchQuery, seriesGroups]);

  const fetchSeries = async () => {
    try {
      setIsLoading(true); setError('');
      const res = await fetch('https://m3u.ch/pl/03664cc59ee4eac89483715db404d9f0_0d5bec11282cce0532a95a62a4bb056f.m3u', { cache: 'no-store' });
      if (!res.ok) throw new Error('Liste alınamadı');
      const text = await res.text();
      const parsed = parseM3U(text);
      const grouped = groupSeries(parsed);
      setSeriesGroups(grouped); setFilteredGroups(grouped);
    } catch (err: any) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  const parseM3U = (content: string): { name: string; url: string; group: string }[] => {
    const result: { name: string; url: string; group: string }[] = [];
    const lines = content.split('\n');
    let cur: any = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#EXTINF:')) {
        const group = line.match(/group-title="([^"]*)"/)?.[1] || 'Diziler';
        const name = line.split(',').pop()?.trim() || `Dizi ${i}`;
        cur = { name, group, url: '' };
      } else if (line && (line.startsWith('http://') || line.startsWith('https://')) && cur) {
        cur.url = line;
        result.push({ ...cur });
        cur = null;
      }
    }
    return result;
  };

  const groupSeries = (items: { name: string; url: string; group: string }[]): SeriesGroup[] => {
    const groups: Map<string, Episode[]> = new Map();
    const groupCategories: Map<string, string> = new Map();

    items.forEach(item => {
      // "Dizi Adı S01E01" veya "Dizi Adı 1. Bölüm" formatını yakala
      let baseName = item.name
        .replace(/\s*S\d+E\d+\s*/gi, '')  // S01E01
        .replace(/\s*\d+\.\s*Bölüm\s*/gi, '') // 1. Bölüm
        .replace(/\s*Bölüm\s*\d+\s*/gi, '')   // Bölüm 1
        .replace(/\s*Sezon\s*\d+\s*/gi, '')   // Sezon 1
        .replace(/\s*-\s*\d+\s*$/, '')        // sondaki - 1
        .replace(/\s*\(\d+\)\s*$/, '')        // sondaki (1)
        .trim();

      // Çok kısaldıysa orijinal ismi kullan
      if (baseName.length < 3) baseName = item.name;

      if (!groups.has(baseName)) {
        groups.set(baseName, []);
        groupCategories.set(baseName, item.group);
      }
      groups.get(baseName)!.push({
        id: `ep_${Math.random().toString(36).slice(2)}`,
        name: item.name,
        url: item.url,
      });
    });

    return Array.from(groups.entries())
      .map(([name, episodes]) => ({
        name,
        episodes: episodes.sort((a, b) => a.name.localeCompare(b.name)),
        group: groupCategories.get(name) || 'Diziler',
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const handleSeriesClick = (series: SeriesGroup) => {
    setSelectedSeries(series);
  };

  const handleEpisodeSelect = (episode: Episode) => {
    setCurrentChannel({
      id: episode.id,
      name: episode.name,
      logo: '',
      url: episode.url,
      group: selectedSeries?.group || 'Diziler',
      quality: 'HD',
    });
    setSelectedEpisode(episode);
  };

  const handleBackFromPlayer = () => { setSelectedEpisode(null); setCurrentChannel(null); };
  const handleBackToSeries = () => { setSelectedSeries(null); };

  // PLAYER
  if (selectedEpisode) {
    return (
      <MainLayout>
        <div className="p-3 sm:p-4 space-y-4">
          <VideoPlayer onBack={handleBackFromPlayer} />
          <div>
            <h2 className="text-base font-semibold">{selectedEpisode.name}</h2>
            <p className="text-xs text-gray-400">{selectedSeries?.name}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // BÖLÜM LİSTESİ
  if (selectedSeries) {
    return (
      <MainLayout>
        <div className="p-3 sm:p-4 lg:p-6">
          <div className="flex items-center space-x-3 mb-4">
            <button onClick={handleBackToSeries} className="p-2 hover:bg-white/10 rounded-lg">
              <FiChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold">{selectedSeries.name}</h1>
              <p className="text-xs text-gray-400">{selectedSeries.episodes.length} bölüm</p>
            </div>
          </div>

          <div className="space-y-1">
            {selectedSeries.episodes.map((ep, index) => (
              <motion.div
                key={ep.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className="flex items-center space-x-3 p-3 bg-[#1a1a1a] rounded-xl cursor-pointer hover:bg-[#252525] border border-gray-800/30 active:scale-[0.99] transition-all"
                onClick={() => handleEpisodeSelect(ep)}
              >
                <div className="w-10 h-10 bg-[#111] rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-gray-500">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white truncate">{ep.name}</h3>
                </div>
                <button className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                  <FiPlay className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  // DİZİ LİSTESİ
  return (
    <MainLayout>
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2"><FiMonitor className="text-purple-400" /> Diziler</h1>
            <p className="text-xs text-gray-400">{seriesGroups.length} dizi</p>
          </div>
        </div>

        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Dizi ara..."
            className="w-full bg-[#1a1a1a] border border-gray-700/50 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
          {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1"><FiX className="w-4 h-4 text-gray-400" /></button>}
        </div>

        {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4"><p className="text-red-400 text-sm">{error}</p></div>}
        {isLoading && <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>}

        {!isLoading && !error && (
          <div className="space-y-1">
            {filteredGroups.map((series, index) => (
              <motion.div
                key={series.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className="flex items-center space-x-3 p-3 bg-[#1a1a1a] rounded-xl cursor-pointer hover:bg-[#252525] border border-gray-800/30 active:scale-[0.99] transition-all"
                onClick={() => handleSeriesClick(series)}
              >
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">📺</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white truncate">{series.name}</h3>
                  <p className="text-xs text-gray-500">{series.episodes.length} bölüm • {series.group}</p>
                </div>
                <span className="px-1.5 py-0.5 bg-purple-500/80 rounded text-[9px] font-bold text-white flex-shrink-0">{series.episodes.length}</span>
                <FiChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
