'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { CATEGORIES } from '@/utils/constants';

export default function CategoryTabs() {
  const { activeCategory, setActiveCategory } = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Aktif kategoriyi görünür alana kaydır
  useEffect(() => {
    if (activeTabRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const element = activeTabRef.current;
      const scrollLeft = element.offsetLeft - container.offsetWidth / 2 + element.offsetWidth / 2;
      
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth',
      });
    }
  }, [activeCategory]);

  return (
    <div className="relative">
      {/* Sol gradient */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
      
      {/* Sağ gradient */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10 pointer-events-none" />

      <div
        ref={scrollRef}
        className="flex space-x-1 overflow-x-auto scrollbar-hide py-2 px-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category.id;
          
          return (
            <button
              key={category.id}
              ref={isActive ? activeTabRef : null}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-medium
                whitespace-nowrap transition-all duration-200 relative
                ${isActive 
                  ? 'text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
              
              {isActive && (
                <motion.div
                  layoutId="categoryBg"
                  className="absolute inset-0 bg-blue-500/10 border border-blue-500/20 rounded-lg"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
