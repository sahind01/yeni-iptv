'use client';

import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { useStore } from '@/store/useStore';
import { useDebounce } from '@/hooks/useDebounce';
import { helpers } from '@/utils/helpers';

interface SearchBarProps {
  onClose?: () => void;
}

export default function SearchBar({ onClose }: SearchBarProps) {
  const { channels, setFilteredChannels, searchQuery, setSearchQuery } = useStore();
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const debouncedQuery = useDebounce(localQuery, 200);
  const inputRef = useRef<HTMLInputElement>(null);

  // Otomatik focus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Arama filtresi
  useEffect(() => {
    setSearchQuery(debouncedQuery);
    const filtered = helpers.filterChannels(channels, debouncedQuery);
    setFilteredChannels(filtered);
  }, [debouncedQuery, channels]);

  const handleClear = () => {
    setLocalQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
      
      <input
        ref={inputRef}
        type="text"
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        placeholder="Kanal ara..."
        className="w-full bg-white/5 border border-gray-700/50 rounded-xl
          pl-10 pr-10 py-2.5 text-white placeholder-gray-500
          focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
          transition-all text-sm"
        autoComplete="off"
      />
      
      {localQuery && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 
            hover:bg-white/10 rounded-full transition-colors"
        >
          <FiX className="w-4 h-4 text-gray-400" />
        </button>
      )}
    </div>
  );
}
