'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMenu, FiSearch, FiX } from 'react-icons/fi';
import { useStore } from '@/store/useStore';
import SearchBar from '@/components/UI/SearchBar';

export default function Header() {
  const { toggleSidebar, sidebarOpen } = useStore();
  const [showSearch, setShowSearch] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-[#0f0f0f]/95 backdrop-blur-lg 
      border-b border-gray-800/50 z-30 lg:hidden">
      <div className="flex items-center justify-between h-full px-4">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Menü"
        >
          <FiMenu className="w-5 h-5" />
        </button>

        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
          Mutlu Player
        </h1>

        <button
          onClick={() => setShowSearch(!showSearch)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Ara"
        >
          {showSearch ? <FiX className="w-5 h-5" /> : <FiSearch className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobil Arama */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#0f0f0f] border-b border-gray-800/50 px-4 py-3"
          >
            <SearchBar onClose={() => setShowSearch(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// AnimatePresence import
import { AnimatePresence } from 'framer-motion';
