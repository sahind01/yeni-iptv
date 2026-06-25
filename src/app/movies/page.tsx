'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import VidPlayer from '@/components/Player/VidPlayer';
import { useStore } from '@/store/useStore';
import { FiFilm, FiChevronRight, FiSearch, FiX } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface MovieItem {
  id: string;
  name: string;
  url: string;
  group: string;
}

interface FilmCategory {
  name: string;
  url: string;
}

export default function MoviesPage() {
  const [categories, setCategories] = useState<FilmCategory[]>([]);
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilmCategory | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<MovieItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { setCurrentChannel } = useStore();

  useEffect(() => {
    const catsStr = process.env.NEXT_PUBLIC_FILM_KATEGORILER;
    if (catsStr) {
      const cats = catsStr.split(',').map(c => {
        const [name, url] = c.split('|');
        return { name: name.trim(), url: url.trim() };
      });
      setCategories(cats);
    }
  }, []);

  const fetchMovies = async (url: string) => {
    try {
      setIsLoading(true); setError('');
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('Liste alınamadı');
      const text = await res.text();
      const parsed = parseM3U(text);
      setMovies(parsed);
    } catch (err: any) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  const parseM3U = (content: string): MovieItem[] => {
    const result: MovieItem[] = [];
    const lines = content.split('\n');
    let cur: any = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#EXTINF:')) {
        const group = line.match(/group-title="([^"]*)"/)?.[1] || 'Film';
        const name = line.split(',').pop()?.trim() || `Film ${i}`;
        cur = { id: `m_${i}`, name, group, url: '' };
      } else if (line && (line.startsWith('http://') || line.startsWith('https://')) && cur) {
        cur.url = line;
        result.push({ ...cur });
        cur = null;
      }
    }
    return result;
  };

  const handleCategoryClick = (cat: FilmCategory) => {
    setSelectedCategory(cat);
    setSearchQuery('');
    fetchMovies(cat.url);
  };

  const handleMovieSelect = (movie: MovieItem) => {
    setCurrentChannel({ id: movie.id, name: movie.name, logo: '', url: movie.url, group: movie.group, quality: 'HD' });
    setSelectedMovie(movie);
  };

  const handleBack = () => { setSelectedMovie(null); setCurrentChannel(null); };
  const handleBackToCategories = () => { setSelectedCategory(null); setMovies([]); setSearchQuery(''); };

  const filteredMovies = searchQuery.trim()
    ? movies.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : movies;

  if (selectedMovie) {
    return (
      <MainLayout>
        <div className="p-3 sm:p-4 space-y-4">
          <VidPlayer onBack={handleBack} />
          <div><h2 className="text-base font-semibold">{selectedMovie.name}</h2><p className="text-xs text-gray-400">{selectedMovie.group}</p></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-3 sm:p-4 lg:p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2"><FiFilm className="text-blue-400" /> Filmler</h1>
            <p className="text-[10px] sm:text-xs text-gray-400">
              {selectedCategory ? `${movies.length} film` : `${categories.length} kategori`}
            </p>
          </div>
        </div>

        {!selectedCategory ? (
          /* KATEGORİ LİSTESİ */
          <div className="space-y-2">
            {categories.map((cat, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleCategoryClick(cat)}
                className="w-full p-4 rounded-xl border border-gray-700 bg-[#1a1a1a] hover:bg-[#222] cursor-pointer transition-all flex items-center justify-between active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🎬</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">{cat.name}</h3>
                </div>
                <FiChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
              </motion.button>
            ))}
          </div>
        ) : (
          /* FİLM LİSTESİ */
          <div>
            {/* ÜST BAR: GERİ + ARAMA */}
            <div className="flex items-center gap-2 mb-3">
              <button onClick={handleBackToCategories} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg flex-shrink-0">
                <span className="text-sm">←</span>
              </button>
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Film ara..."
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl pl-9 pr-8 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-lg">
                    <FiX className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-400 mb-2">{selectedCategory.name} • {filteredMovies.length} film</p>

            {isLoading && (
              <div className="flex justify-center py-10"><div className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>
            )}

            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-3"><p className="text-red-400 text-xs">{error}</p></div>}

            {!isLoading && !error && filteredMovies.length === 0 && (
              <div className="text-center py-10">
                <p className="text-gray-500 text-sm">Film bulunamadı</p>
              </div>
            )}

            {!isLoading && !error && (
              <div className="space-y-1">
                {filteredMovies.map((movie, index) => (
                  <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.005 }}
                    className="flex items-center space-x-3 p-3 bg-[#1a1a1a] rounded-xl cursor-pointer hover:bg-[#252525] border border-gray-800/30 active:scale-[0.99] transition-all"
                    onClick={() => handleMovieSelect(movie)}
                  >
                    <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-blue-400">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-white truncate">{movie.name}</h3>
                      <p className="text-[10px] text-gray-500">{movie.group}</p>
                    </div>
                    <FiChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
