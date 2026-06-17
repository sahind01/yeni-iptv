'use client';

import { motion } from 'framer-motion';
import { FiX, FiCheck } from 'react-icons/fi';
import { QUALITY_OPTIONS } from '@/utils/constants';

interface QualitySelectorProps {
  onSelect: (level: number) => void;
  onClose: () => void;
  currentQuality?: number;
}

export default function QualitySelector({ onSelect, onClose, currentQuality = -1 }: QualitySelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#1a1a1a] border border-gray-700 rounded-2xl p-4 w-64"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Kalite</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          {QUALITY_OPTIONS.map((option, index) => {
            const levelIndex = index - 1; // -1: auto, 0: ilk kalite, 1: ikinci...
            const isActive = currentQuality === levelIndex;

            return (
              <button
                key={option.value}
                onClick={() => onSelect(levelIndex)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm
                  transition-colors ${
                    isActive 
                      ? 'bg-blue-500/10 text-blue-400' 
                      : 'hover:bg-white/5 text-gray-400'
                  }`}
              >
                <span>{option.label}</span>
                {isActive && <FiCheck className="w-4 h-4" />}
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
