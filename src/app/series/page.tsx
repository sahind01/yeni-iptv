'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import VideoPlayer from '@/components/Player/VideoPlayer';
import { useStore } from '@/store/useStore';
import { FiMonitor, FiSearch, FiX, FiGrid, FiList, FiPlay } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface Series {
  id: string;
  name: string;
  logo: string;
  url: string;
  group: string;
}

export default function SeriesPage() {
  const [series, setSeries] = useState<Series[]>([]);
  const [filteredSeries, setFilteredSeries] = useState<Series[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCount, setShowCount] = useState(20);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const { setCurrentChannel } = useStore();

  useEffect(() => { fetchSeries(); }, []);

  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    setFilteredSeries(q ? series.filter(s => s.name.toLowerCase().includes(q)) : series);
    setShowCount(20);
  }, [searchQuery, series]);

  const fetchSeries = async () => {
    try {
      setIsLoading(true); setError('');
      const res = await fetch('https://m3u.ch/pl/03664cc59ee4eac89483715db404d9f0_0d5bec11282cce0532a95a62a4bb056f.m3u', { cache: 'no-store' });
      if (!res.ok) throw new Error('Liste alınamadı');
      const text = await res.text();
      const parsed = parseM3U(text);
      setSeries(parsed); setFilteredSeries(parsed);
    } catch (err: any) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  const parseM3U = (content: string): Series[] => {
    const result: Series[] = [];
    const lines = content.split('\n');
    let cur: any = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#EXTINF:')) {
        const logo = line.match(/tvg-logo="([^"]*)"/)?.[1] || '';
        const group = line.match(/group-title="([^"]*)"/)?.[1] || 'Diziler';
        const name = line.split(',').pop()?.trim() || `Dizi ${i}`;
        cur = { id: `series_${i}`, name, logo, group, url: '' };
      } else if (line && (line.startsWith('http://') || line.startsWith('https://')) && cur) {
        cur.url = line;
        const g = (cur.group || '').toLowerCase();
        const n = (cur.name || '').toLowerCase();
        // Dizi kategorileri
        if (g.includes('dizi') || g.includes('serie') || g.includes('tv') || g.includes('show') ||
            g.includes('dram') || g.includes('komedi') || g.includes('aksiyon') || g.includes('bilim') ||
            g.includes('macera') || g.includes('gerilim') || g.includes('korku') || g.includes('romantik') ||
            g.includes('fantastik') || g.includes('gizem') || g.includes('savaş') || g.includes('suç') ||
            g.includes('tarih') || g.includes('aile') || g.includes('animasyon') || g.includes('belgesel') ||
            g.includes('çocuk') || g.includes('yerli') || g.includes('türk') ||
            n.includes('dizi') || n.includes('bölüm') || n.includes('sezon') || n.includes('episode')) {
          result.push({ ...cur });
        }
        cur = null;
      }
    }
    return result;
  };

  const handleSeriesSelect = (item: Series) => {
    setCurrentChannel({ id: item.id, name: item.name, logo: item.logo, url: item.url, group: item.group, quality: 'HD' });
    setSelectedSeries(item);
  };

  const handleBackFromPlayer = () => { setSelectedSeries(null); setCurrentChannel(null); };

  const displayed = filteredSeries.slice(0, showCount);
  const hasMore = showCount < filteredSeries.length;

  if (selectedSeries) {
    return (
      <MainLayout>
        <div className="p-3 sm:p-4 space-y-4">
          <VideoPlayer onBack={handleBackFromPlayer} />
          <div><h2 className="text-base font-semibold">{selectedSeries.name}</h2><p className="text-xs text-gray-400">{selectedSeries.group}</p></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2"><FiMonitor className="text-purple-400" /> Diziler</h1>
            <p className="text-xs text-gray-400">{series.length} dizi</p>
          </div>
          <div className="flex bg-[#1a1a1a] rounded-lg p-0.5 border border-gray-700/50">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500'}`}>
              <FiGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500'}`}>
              <FiList className="w-4 h-4" />
            </button>
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
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
                {displayed.map(item => (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-[#1a1a1a] rounded-xl overflow-hidden cursor-pointer hover:bg-[#252525] border border-gray-800/30 active:scale-[0.98] transition-all"
                    onClick={() => handleSeriesSelect(item)}>
                    <div className="aspect-[2/3] bg-[#111] flex items-center justify-center p-3 relative">
                      {item.logo ? <img src={item.logo} alt={item.name} className="w-full h-full object-cover rounded-lg" loading="lazy" onError={e => (e.target as HTMLImageElement).style.display='none'} /> : null}
                      <div className={`${item.logo ? 'hidden' : 'flex'} flex-col items-center`}>
                        <span className="text-3xl mb-2">📺</span>
                        <span className="text-[10px] text-gray-500 text-center px-2 line-clamp-2">{item.name}</span>
                      </div>
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-purple-500/80 rounded text-[9px] font-medium">HD</div>
                    </div>
                    <div className="p-2">
                      <h3 className="text-[11px] font-medium text-white truncate">{item.name}</h3>
                      <p className="text-[9px] text-gray-500 mt-0.5">{item.group}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {displayed.map((item, index) => (
                  <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.02 }}
                    className="flex items-center space-x-3 p-3 bg-[#1a1a1a] rounded-xl cursor-pointer hover:bg-[#252525] border border-gray-800/30 active:scale-[0.99] transition-all"
                    onClick={() => handleSeriesSelect(item)}>
                    <div className="w-10 h-14 bg-[#111] rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.logo ? <img src={item.logo} alt={item.name} className="w-full h-full object-cover" onError={e => (e.target as HTMLImageElement).style.display='none'} /> : <span className="text-lg">📺</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-white truncate">{item.name}</h3>
                      <p className="text-xs text-gray-500 truncate">{item.group}</p>
                    </div>
                    <span className="px-1.5 py-0.5 bg-purple-500/80 rounded text-[9px] font-bold text-white">HD</span>
                    <button className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><FiPlay className="w-4 h-4" /></button>
                  </motion.div>
                ))}
              </div>
            )}

            {hasMore && (
              <div className="text-center mt-6">
                <button onClick={() => setShowCount(p => p + 20)} className="px-6 py-2.5 bg-[#1a1a1a] border border-gray-700/50 rounded-xl text-sm">Daha Fazla</button>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
