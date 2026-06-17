'use client';

import { useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';

export default function CategoryTabs() {
  const { channels, activeCategory, setActiveCategory } = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // M3U'dan gelen group-title'lere göre kategorileri oluştur
  const categories = useMemo(() => {
    const cats = new Map<string, { count: number; icon: string }>();
    
    // Tümü
    cats.set('all', { count: channels.length, icon: '📺' });
    
    channels.forEach(channel => {
      const group = channel.group || 'Diğer';
      const key = group.toLowerCase().replace(/\s+/g, '_');
      
      if (cats.has(key)) {
        cats.get(key)!.count++;
      } else {
        cats.set(key, { count: 1, icon: getCategoryIcon(group) });
      }
    });
    
    return Array.from(cats.entries()).map(([id, data]) => ({
      id,
      name: id === 'all' ? 'Tümü' : (channels.find(c => (c.group || '').toLowerCase().replace(/\s+/g, '_') === id)?.group || id),
      icon: data.icon,
      count: data.count,
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

  useEffect(() => {
    if (activeTabRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const element = activeTabRef.current;
      const scrollLeft = element.offsetLeft - container.offsetWidth / 2 + element.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [activeCategory]);

  if (categories.length <= 1) return null;

  return (
    <div className="relative">
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
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-medium
                whitespace-nowrap transition-all duration-200 relative
                ${isActive 
                  ? 'text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <span className="text-base">{cat.icon}</span>
              <span>{cat.name}</span>
              <span className={`text-[10px] ml-1 ${isActive ? 'text-blue-400' : 'text-gray-600'}`}>
                {cat.count}
              </span>
              
              {isActive && (
                <motion.div
                  layoutId="activeCategoryBg"
                  className="absolute inset-0 bg-blue-500/10 border border-blue-500/20 rounded-xl"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
