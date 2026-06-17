'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX } from 'react-icons/fi';
import { useStore } from '@/store/useStore';

export default function CategoryTabs() {
  const { channels, activeCategory, setActiveCategory } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  const categories = useMemo(() => {
    const cats = new Map<string, { count: number; icon: string; name: string }>();
    
    cats.set('all', { count: channels.length, icon: '📺', name: 'Tümü' });
    
    channels.forEach(channel => {
      const group = channel.group || 'Diğer';
      const key = group.toLowerCase().replace(/\s+/g, '_');
      
      if (cats.has(key)) {
        cats.get(key)!.count++;
      } else {
        cats.set(key, { 
          count: 1, 
          icon: getCategoryIcon(group), 
          name: group 
        });
      }
    });
    
    return Array.from(cats.entries()).map(([id, data]) => ({
      id,
      ...data,
    }));
  }, [channels]);

  function getCategoryIcon(group: string): string {
    const g = group.toLowerCase();
    if (g.includes('spor') || g.includes('sport')) return '⚽';
    if (g.includes('film') || g.includes('movie') || g.includes('sinema')) return '🎬';
    if (g.includes('dizi') || g.includes('serie')) return '📺';
    if (g.includes('haber') || g.includes('news')) return '📰';
    if (g.includes('müzik') || g.includes('music') || g.includes('muzik')) return '🎵';
    if (g.includes('belgesel') || g.includes('documentary')) return '🌍';
    if (g.includes('çocuk') || g.includes('cocuk') || g.includes('kid')) return '🧒';
    if (g.includes('yabancı') || g.includes('foreign') || g.includes('international')) return '🌐';
    if (g.includes('adult') || g.includes('xxx') || g.includes('18')) return '🔞';
    if (g.includes('dini') || g.includes('religious')) return '🕌';
    if (g.includes('yerli') || g.includes('ulusal')) return '🇹🇷';
    return '📡';
  }

  const activeCategoryData = categories.find(c => c.id === activeCategory);

  if (categories.length <= 1) return null;

  return (
    <>
      {/* MOBİL: Hamburger Menü */}
      <div className="lg:hidden px-4 pt-2">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex items-center space-x-2 bg-[#1a1a1a] border border-gray-700/50 rounded-xl px-4 py-2.5 w-full text-left"
        >
          <span className="text-lg">{activeCategoryData?.icon || '📺'}</span>
          <span className="text-sm font-medium flex-1">{activeCategoryData?.name || 'Tümü'}</span>
          <span className="text-xs text-gray-500">{activeCategoryData?.count || 0} kanal</span>
          <FiMenu className="w-4 h-4 text-gray-400 ml-2" />
        </button>
      </div>

      {/* MOBİL: Kategori Seçim Modalı */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-[#141414] rounded-t-3xl max-h-[70vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <h3 className="text-lg font-semibold">Kategoriler</h3>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Liste */}
              <div className="overflow-y-auto max-h-[55vh] p-2">
                {categories.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveCategory(cat.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl mb-1 transition-all ${
                        isActive
                          ? 'bg-blue-500/10 border border-blue-500/20'
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <span className="text-xl w-8 text-center">{cat.icon}</span>
                      <span className={`text-sm font-medium flex-1 text-left ${isActive ? 'text-white' : 'text-gray-300'}`}>
                        {cat.name}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-500'
                      }`}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MASASÜSTÜ: Yatay Kaydırma */}
      <div className="hidden lg:block relative">
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10 pointer-events-none" />

        <div
          ref={scrollRef}
          className="flex space-x-1 overflow-x-auto scrollbar-hide py-3 px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            
            return (
              <button
                key={cat.id}
                ref={isActive ? activeTabRef : null}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                  whitespace-nowrap transition-all duration-200 relative
                  ${isActive 
                    ? 'text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <span className="text-sm">{cat.icon}</span>
                <span>{cat.name}</span>
                <span className={`text-[10px] ml-0.5 ${isActive ? 'text-blue-400' : 'text-gray-600'}`}>
                  {cat.count}
                </span>
                
                {isActive && (
                  <motion.div
                    layoutId="activeCategoryBg"
                    className="absolute inset-0 bg-blue-500/10 border border-blue-500/20 rounded-lg"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
