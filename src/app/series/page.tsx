'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import VideoPlayer from '@/components/Player/VideoPlayer';
import { useStore } from '@/store/useStore';
import { FiMonitor, FiSearch, FiX, FiPlay, FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface Episode {
  id: string;
  name: string;
  url: string;
  tvgName: string;
}

interface SeriesGroup {
  name: string;
  episodes: Episode[];
}

export default function SeriesPage() {
  const [seriesGroups, setSeriesGroups] = useState<SeriesGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<SeriesGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
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
      setLoadingProgress(10);

      const cached = sessionStorage.getItem('mutlu_series_cache');
      const cacheTime = sessionStorage.getItem('mutlu_series_cache_time');

      if (cached && cacheTime && (Date.now() - parseInt(cacheTime) < 30 * 60 * 1000)) {
        const parsed = JSON.parse(cached);
        setSeriesGroups(parsed); setFilteredGroups(parsed);
        setIsLoading(false);
        return;
      }

      setLoadingProgress(30);
      const res = await fetch('https://m3u.ch/pl/03664cc59ee4eac89483715db404d9f0_0d5bec11282cce0532a95a62a4bb056f.m3u', { cache: 'no-store' });
      setLoadingProgress(60);
      if (!res.ok) throw new Error('Liste alınamadı');
      const text = await res.text();
      setLoadingProgress(80);
      const parsed = parseAndGroupM3U(text);
      setLoadingProgress(95);

      sessionStorage.setItem('mutlu_series_cache', JSON.stringify(parsed));
      sessionStorage.setItem('mutlu_series_cache_time', Date.now().toString());

      setSeriesGroups(parsed); setFilteredGroups(parsed);
      setLoadingProgress(100);
    } catch (err: any) { setError(err.message); }
    finally { setTimeout(() => setIsLoading(false), 300); }
  };

  const parseAndGroupM3U = (content: string): SeriesGroup[] => {
    const groups: Map<string, Episode[]> = new Map();
    const lines = content.split('\n');
    let curGroup = '';
    let curName = '';
    let curTvgName = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#EXTINF:')) {
        const groupMatch = line.match(/group-title="([^"]*)"/);
        curGroup = groupMatch ? groupMatch[1].trim() : 'Diğer Diziler';
        const tvgNameMatch = line.match(/tvg-name="([^"]*)"/);
        curTvgName = tvgNameMatch ? tvgNameMatch[1].trim() : '';
        const nameParts = line.split(',');
        curName = nameParts.length > 1 ? nameParts[nameParts.length - 1].trim() : curTvgName || 'Bilinmeyen';
      } else if (line && (line.startsWith('http://') || line.startsWith('https://')) && curGroup) {
        if (!groups.has(curGroup)) groups.set(curGroup, []);
        groups.get(curGroup)!.push({
          id: `ep_${Math.random().toString(36).slice(2, 8)}`,
          name: curName,
          url: line,
          tvgName: curTvgName,
        });
        curGroup = ''; curName = ''; curTvgName = '';
      }
    }

    const result: SeriesGroup[] = [];
    const misc: Episode[] = [];
    groups.forEach((episodes, name) => {
      if (episodes.length >= 2) result.push({ name, episodes });
      else misc.push(...episodes);
    });
    if (misc.length > 0) result.push({ name: 'Diğer Diziler', episodes: misc });
    return result.sort((a, b) => a.name.localeCompare(b.name));
  };

  const handleSeriesClick = (series: SeriesGroup) => setSelectedSeries(series);

  const handleEpisodeSelect = (episode: Episode) => {
    setCurrentChannel({ id: episode.id, name: episode.name, logo: '', url: episode.url, group: selectedSeries?.name || 'Diziler', quality: 'HD' });
    setSelectedEpisode(episode);
  };

  const handleBackFromPlayer = () => { setSelectedEpisode(null); setCurrentChannel(null); };
  const handleBackToSeries = () => setSelectedSeries(null);

  if (selectedEpisode) {
    return (
      <MainLayout>
        <div className="p-3 sm:p-4 space-y-4">
          <VideoPlayer onBack={handleBackFromPlayer} />
          <div><h2 className="text-base font-semibold">{selectedEpisode.name}</h2><p className="text-xs text-gray-400">{selectedSeries?.name}</p></div>
        </div>
      </MainLayout>
    );
  }

  if (selectedSeries) {
    return (
      <MainLayout>
        <div className="p-3 sm:p-4 lg:p-6">
          <div className="flex items-center space-x-3 mb-4">
            <button onClick={handleBackToSeries} className="p-2 hover:bg-white/10 rounded-lg"><FiChevronLeft className="w-5 h-5" /></button>
            <div><h1 className="text-lg font-bold">{selectedSeries.name}</h1><p className="text-xs text-gray-400">{selectedSeries.episodes.length} bölüm</p></div>
          </div>
          <div className="space-y-1">
            {selectedSeries.episodes.map((ep, index) => (
              <motion.div key={ep.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.02 }}
                className="flex items-center space-x-3 p-3 bg-[#1a1a1a] rounded-xl cursor-pointer hover:bg-[#252525] border border-gray-800/30 active:scale-[0.99] transition-all"
                onClick={() => handleEpisodeSelect(ep)}>
                <div className="w-10 h-10 bg-[#111] rounded-lg flex items-center justify-center flex-shrink-0"><span className="text-sm font-bold text-gray-500">{index + 1}</span></div>
                <div className="flex-1 min-w-0"><h3 className="text-sm font-medium text-white truncate">{ep.name}</h3>{ep.tvgName && <p className="text-[10px] text-gray-500 truncate">{ep.tvgName}</p>}</div>
                <button className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><FiPlay className="w-4 h-4" /></button>
              </motion.div>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <div><h1 className="text-xl font-bold flex items-center gap-2"><FiMonitor className="text-purple-400" /> Diziler</h1><p className="text-xs text-gray-400">{seriesGroups.length} dizi</p></div>
        </div>

        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Dizi ara..."
            className="w-full bg-[#1a1a1a] border border-gray-700/50 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
          {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1"><FiX className="w-4 h-4 text-gray-400" /></button>}
        </div>

        {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4"><p className="text-red-400 text-sm">{error}</p></div>}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
            <p className="text-gray-400 text-sm mb-2">Diziler yükleniyor...</p>
            <div className="w-48 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full transition-all duration-300" style={{ width: `${loadingProgress}%` }} />
            </div>
          </div>
        )}

        {!isLoading && !error && seriesGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="text-4xl mb-4">📺</span>
            <p className="text-gray-400">Dizi bulunamadı</p>
            <button onClick={fetchSeries} className="mt-4 px-4 py-2 bg-purple-500 rounded-lg text-sm">Tekrar Dene</button>
          </div>
        )}

        {!isLoading && !error && seriesGroups.length > 0 && (
          <div className="space-y-1">
            {filteredGroups.map((series, index) => (
              <motion.div key={series.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.02 }}
                className="flex items-center space-x-3 p-3 bg-[#1a1a1a] rounded-xl cursor-pointer hover:bg-[#252525] border border-gray-800/30 active:scale-[0.99] transition-all"
                onClick={() => handleSeriesClick(series)}>
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0"><span className="text-lg">📺</span></div>
                <div className="flex-1 min-w-0"><h3 className="text-sm font-medium text-white truncate">{series.name}</h3><p className="text-xs text-gray-500">{series.episodes.length} bölüm</p></div>
                <span className="px-2 py-0.5 bg-purple-500/80 rounded text-[10px] font-bold text-white flex-shrink-0">{series.episodes.length}</span>
                <FiChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
