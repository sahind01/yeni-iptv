'use client';

import { motion } from 'framer-motion';
import { FiClock, FiChevronRight } from 'react-icons/fi';
import type { EPGData } from '@/types';

interface EPGInfoProps {
  epg: EPGData;
}

export default function EPGInfo({ epg }: EPGInfoProps) {
  if (!epg?.current) return null;

  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString('tr-TR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return timeStr;
    }
  };

  const getProgress = () => {
    if (!epg.current) return 0;
    const start = new Date(epg.current.start).getTime();
    const end = new Date(epg.current.end).getTime();
    const now = Date.now();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    return ((now - start) / (end - start)) * 100;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1a1a1a] rounded-xl p-4 space-y-3"
    >
      {/* Şu anki yayın */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-blue-400 font-medium">Şimdi</span>
          <span className="text-xs text-gray-500 flex items-center">
            <FiClock className="w-3 h-3 mr-1" />
            {formatTime(epg.current.start)} - {formatTime(epg.current.end)}
          </span>
        </div>
        
        <h4 className="text-sm font-medium">{epg.current.title}</h4>
        
        {epg.current.description && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
            {epg.current.description}
          </p>
        )}

        {/* İlerleme çubuğu */}
        <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${getProgress()}%` }}
            transition={{ duration: 1, ease: 'linear' }}
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
          />
        </div>
      </div>

      {/* Sonraki yayın */}
      {epg.next && (
        <div className="border-t border-gray-800 pt-3">
          <div className="flex items-center mb-1">
            <FiChevronRight className="w-4 h-4 text-gray-500 mr-1" />
            <span className="text-xs text-gray-500">Sonraki</span>
          </div>
          <h4 className="text-sm text-gray-400">{epg.next.title}</h4>
          <span className="text-xs text-gray-600 flex items-center mt-1">
            <FiClock className="w-3 h-3 mr-1" />
            {formatTime(epg.next.start)} - {formatTime(epg.next.end)}
          </span>
        </div>
      )}
    </motion.div>
  );
}
