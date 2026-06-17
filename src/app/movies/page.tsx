'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { useStore } from '@/store/useStore';
import { FiFilm, FiSearch, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCount, setShowCount] = useState(20);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { username, password } = useStore();

  useEffect(() => {
    fetchMovies();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      setFilteredMovies(movies.filter(m => m.name.toLowerCase().includes(q)));
    } else {
      setFilteredMovies(movies);
    }
    setShowCount(20);
  }, [searchQuery, movies]);

  const fetchMovies = async () => {
    const user = username || useStore.getState().username;
    const pass = password || useStore.getState().password;
    
    if (!user || !pass) {
      setError('Lütfen önce giriş yapın');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // GitHub'dan M3U çek
      const response = await fetch('https://raw.githubusercontent.com/kimbumuratyavuz/capcanli/refs/heads/main/fullhd.m3u', {
        cache: 'no-store'
      });

      if (!response.ok) throw new Error('Film listesi alınamadı');

      const m3uContent = await response.text();
      const parsedMovies = parseM3U(m3uContent);

      if (parsedMovies.length === 0) {
        setError('Film bulunamadı');
      } else {
        setMovies(parsedMovies);
        setFilteredMovies(parsedMovies);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const parseM3U = (content: string): Movie[] => {
    const movies: Movie[] = [];
    const lines = content.split('\n').map(l => l.trim());
    let current: Partial<Movie> = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('#EXTINF:')) {
        const logoMatch = line.match(/tvg-logo="([^"]*)"/);
        const groupMatch = line.match(/group-title="([^"]*)"/);
        const nameParts = line.split(',');
        const displayName = nameParts.length > 1 ? nameParts[nameParts.length - 1].trim() : '';

        current = {
          id: `movie_${i}`,
          name: displayName || 'Film',
          logo: logoMatch?.[1] || '',
          group: groupMatch?.[1] || 'Filmler',
          url: '',
        };
      } else if ((line.startsWith('http://') || line.startsWith('https://')) && current.name) {
        current.url = line;
        // Sadece film grubundakileri al
        const group = (current.group || '').toLowerCase();
        if (group.includes('film') || group.includes('movie') || group.includes('sinema')) {
          movies.push(current as Movie);
        }
        current = {};
      }
    }

    return movies;
  };

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.src = movie.url;
        videoRef.current.play().catch(() => {});
      }
    }, 100);
  };

  const handleBack = () => {
    setSelectedMovie(null);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
    }
  };

  const loadMore = () => {
    setShowCount(prev => prev + 20);
  };

  const displayedMovies = filteredMovies.slice(0, showCount);
  const hasMore = showCount < filteredMovies.length;

  return (
    <MainLayout>
      <div className="p-3 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <FiFilm className="text-blue-400" />
              Filmler
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              {movies.length} film
            </p>
          </div>
        </div>

        {/* Arama */}
        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Film ara..."
            className="w-full bg-[#1a1a1a] border border-gray-700/50 rounded-xl pl-10 pr-10 py-2.5 text-sm
              text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-lg"
            >
              <FiX className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Hata */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
            <p className="text-red-400 text-sm">{error}</p>
            <button onClick={fetchMovies} className="mt-2 px-4 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs">
              Tekrar Dene
            </button>
          </div>
        )}

        {/* Yükleniyor */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-3" />
            <p className="text-gray-500 text-sm">Filmler yükleniyor...</p>
          </div>
        )}

        {/* Film Grid */}
        {!isLoading && !error && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
              <AnimatePresence>
                {displayedMovies.map((movie) => (
                  <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-[#1a1a1a] rounded-xl overflow-hidden cursor-pointer 
                      hover:bg-[#252525] border border-gray-800/30 hover:border-gray-700/50
                      active:scale-[0.98] transition-all duration-150"
                    onClick={() => handleMovieSelect(movie)}
                  >
                    {/* Poster */}
                    <div className="aspect-[2/3] bg-[#111] flex items-center justify-center p-3 relative">
                      {movie.logo ? (
                        <img
                          src={movie.logo}
                          alt={movie.name}
                          className="w-full h-full object-cover rounded-lg"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.classList.add('no-poster');
                          }}
                        />
                      ) : null}
                      <div className={`${movie.logo ? 'hidden' : ''} no-poster flex flex-col items-center`}>
                        <span className="text-3xl sm:text-4xl mb-2">🎬</span>
                        <span className="text-xs text-gray-500 text-center px-2 line-clamp-2">
                          {movie.name}
                        </span>
                      </div>
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-blue-500/80 rounded text-[9px] font-medium">
                        HD
                      </div>
                    </div>
                    
                    {/* Bilgi */}
                    <div className="p-2 sm:p-3">
                      <h3 className="text-[11px] sm:text-xs font-medium text-white truncate">
                        {movie.name}
                      </h3>
                      <p className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5">
                        {movie.group}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Daha Fazla */}
            {hasMore && (
              <div className="text-center mt-6">
                <button
                  onClick={loadMore}
                  className="px-6 py-2.5 bg-[#1a1a1a] hover:bg-[#252525] border border-gray-700/50 
                    rounded-xl text-sm text-gray-300 transition-colors"
                >
                  Daha Fazla Göster ({filteredMovies.length - showCount} film kaldı)
                </button>
              </div>
            )}

            {/* Boş */}
            {filteredMovies.length === 0 && !isLoading && (
              <div className="text-center py-20">
                <span className="text-4xl sm:text-5xl mb-3 block">🎬</span>
                <p className="text-gray-400 text-sm">
                  {searchQuery ? '"' + searchQuery + '" için film bulunamadı' : 'Film bulunamadı'}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Film Player Modal */}
      <AnimatePresence>
        {selectedMovie && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black"
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/90 to-transparent z-10">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleBack}
                  className="p-2 hover:bg-white/10 rounded-lg text-sm"
                >
                  ← Geri
                </button>
                <div>
                  <h2 className="text-sm font-medium">{selectedMovie.name}</h2>
                  <p className="text-xs text-gray-400">{selectedMovie.group}</p>
                </div>
              </div>
            </div>

            {/* Video */}
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              controls
              autoPlay
              playsInline
            />

            {/* Kapat */}
            <button
              onClick={handleBack}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-white/10 
                backdrop-blur rounded-full text-sm hover:bg-white/20 transition-colors z-10"
            >
              Kapat
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}
