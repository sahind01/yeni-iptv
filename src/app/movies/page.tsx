'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import VideoPlayer from '@/components/Player/VodPlayer';
import { useStore } from '@/store/useStore';
import { FiFilm, FiSearch, FiX, FiGrid, FiList, FiPlay, FiLoader } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface Movie {
  id: string;
  name: string;
  logo: string;
  url: string;
  group: string;
}

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCount, setShowCount] = useState(20);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const { setCurrentChannel } = useStore();

  useEffect(() => { fetchMovies(); }, []);

  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    setFilteredMovies(q ? movies.filter(m => m.name.toLowerCase().includes(q)) : movies);
    setShowCount(20);
  }, [searchQuery, movies]);

  const fetchMovies = async () => {
    try {
      setIsLoading(true); setError('');
      setLoadingProgress(10);

      const cached = sessionStorage.getItem('mutlu_movies_cache');
      const cacheTime = sessionStorage.getItem('mutlu_movies_cache_time');
      
      if (cached && cacheTime && (Date.now() - parseInt(cacheTime) < 30 * 60 * 1000)) {
        const parsed = JSON.parse(cached);
        setMovies(parsed); setFilteredMovies(parsed);
        setIsLoading(false);
        return;
      }

      setLoadingProgress(30);
      const m3uUrl = process.env.NEXT_PUBLIC_MOVIES_M3U;
      if (!m3uUrl) throw new Error('M3U linki bulunamadı');
      const res = await fetch(m3uUrl, { cache: 'no-store' });
      setLoadingProgress(60);
      
      if (!res.ok) throw new Error('Liste alınamadı');
      const text = await res.text();
      setLoadingProgress(80);
      
      const parsed = parseM3U(text);
      setLoadingProgress(95);
      
      sessionStorage.setItem('mutlu_movies_cache', JSON.stringify(parsed));
      sessionStorage.setItem('mutlu_movies_cache_time', Date.now().toString());
      
      setMovies(parsed); setFilteredMovies(parsed);
      setLoadingProgress(100);
    } catch (err: any) { setError(err.message); }
    finally { setTimeout(() => setIsLoading(false), 300); }
  };

  const parseM3U = (content: string): Movie[] => {
    const result: Movie[] = [];
    const lines = content.split('\n');
    let cur: any = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#EXTINF:')) {
        const logo = line.match(/tvg-logo="([^"]*)"/)?.[1] || '';
        const group = line.match(/group-title="([^"]*)"/)?.[1] || 'Filmler';
        const name = line.split(',').pop()?.trim() || `Film ${i}`;
        cur = { id: `movie_${i}`, name, logo, group, url: '' };
      } else if (line && (line.startsWith('http://') || line.startsWith('https://')) && cur) {
        cur.url = line;
        const g = (cur.group || '').toLowerCase();
        if (g.includes('film') || g.includes('dizi') || g.includes('movie') || g.includes('serie') ||
            g.includes('aksiyon') || g.includes('komedi') || g.includes('dram') || g.includes('korku') ||
            g.includes('bilim') || g.includes('macera') || g.includes('animasyon') || g.includes('belgesel') ||
            g.includes('fantastik') || g.includes('gerilim') || g.includes('romantik') || g.includes('savaş') ||
            g.includes('suç') || g.includes('gizem') || g.includes('tarih') || g.includes('aile') ||
            g.includes('çocuk') || g.includes('yerli')) {
          result.push({ ...cur });
        }
        cur = null;
      }
    }
    return result;
  };

  const handleMovieSelect = (movie: Movie) => {
    setCurrentChannel({ id: movie.id, name: movie.name, logo: movie.logo, url: movie.url, group: movie.group, quality: 'HD' });
    setSelectedMovie(movie);
  };

  const handleBackFromPlayer = () => { setSelectedMovie(null); setCurrentChannel(null); };

  const displayed = filteredMovies.slice(0, showCount);
  const hasMore = showCount < filteredMovies.length;

  if (selectedMovie) {
    return (
      <MainLayout>
        <div className="p-3 sm:p-4 space-y-4">
          <VideoPlayer onBack={handleBackFromPlayer} />
          <div><h2 className="text-base font-semibold">{selectedMovie.name}</h2><p className="text-xs text-gray-400">{selectedMovie.group}</p></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2"><FiFilm className="text-blue-400" /> Filmler</h1>
            <p className="text-xs text-gray-400">{movies.length} film</p>
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
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Film ara..."
            className="w-full bg-[#1a1a1a] border border-gray-700/50 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
          {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1"><FiX className="w-4 h-4 text-gray-400" /></button>}
        </div>

        {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4"><p className="text-red-400 text-sm">{error}</p></div>}
        
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-gray-400 text-sm mb-2">Filmler yükleniyor...</p>
            <div className="w-48 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${loadingProgress}%` }} />
            </div>
          </div>
        )}

        {!isLoading && !error && movies.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="text-4xl mb-4">🎬</span>
            <p className="text-gray-400">Film bulunamadı</p>
            <button onClick={fetchMovies} className="mt-4 px-4 py-2 bg-blue-500 rounded-lg text-sm">Tekrar Dene</button>
          </div>
        )}

        {!isLoading && !error && movies.length > 0 && (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
                {displayed.map(movie => (
                  <motion.div key={movie.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-[#1a1a1a] rounded-xl overflow-hidden cursor-pointer hover:bg-[#252525] border border-gray-800/30 active:scale-[0.98] transition-all"
                    onClick={() => handleMovieSelect(movie)}>
                    <div className="aspect-[2/3] bg-[#111] flex items-center justify-center p-3 relative">
                      {movie.logo ? <img src={movie.logo} alt={movie.name} className="w-full h-full object-cover rounded-lg" loading="lazy" onError={e => (e.target as HTMLImageElement).style.display='none'} /> : null}
                      <div className={`${movie.logo ? 'hidden' : 'flex'} flex-col items-center`}>
                        <span className="text-3xl mb-2">🎬</span>
                        <span className="text-[10px] text-gray-500 text-center px-2 line-clamp-2">{movie.name}</span>
                      </div>
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-blue-500/80 rounded text-[9px] font-medium">HD</div>
                    </div>
                    <div className="p-2"><h3 className="text-[11px] font-medium text-white truncate">{movie.name}</h3><p className="text-[9px] text-gray-500 mt-0.5">{movie.group}</p></div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {displayed.map((movie, index) => (
                  <motion.div key={movie.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.02 }}
                    className="flex items-center space-x-3 p-3 bg-[#1a1a1a] rounded-xl cursor-pointer hover:bg-[#252525] border border-gray-800/30 active:scale-[0.99] transition-all"
                    onClick={() => handleMovieSelect(movie)}>
                    <div className="w-10 h-14 bg-[#111] rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {movie.logo ? <img src={movie.logo} alt={movie.name} className="w-full h-full object-cover" onError={e => (e.target as HTMLImageElement).style.display='none'} /> : <span className="text-lg">🎬</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-white truncate">{movie.name}</h3>
                      <p className="text-xs text-gray-500 truncate">{movie.group}</p>
                    </div>
                    <span className="px-1.5 py-0.5 bg-blue-500/80 rounded text-[9px] font-bold text-white">HD</span>
                    <button className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><FiPlay className="w-4 h-4" /></button>
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
