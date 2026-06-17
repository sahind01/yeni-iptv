'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiAlertCircle, FiX } from 'react-icons/fi';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ 
  message, 
  type = 'info', 
  isVisible, 
  onClose, 
  duration = 3000 
}: ToastProps) {
  
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const icons = {
    success: <FiCheck className="w-5 h-5 text-green-400" />,
    error: <FiAlertCircle className="w-5 h-5 text-red-400" />,
    info: <FiAlertCircle className="w-5 h-5 text-blue-400" />,
  };

  const colors = {
    success: 'border-green-500/20 bg-green-500/10',
    error: 'border-red-500/20 bg-red-500/10',
    info: 'border-blue-500/20 bg-blue-500/10',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          className={`fixed top-20 left-1/2 z-[200] flex items-center space-x-3
            px-4 py-3 rounded-xl border backdrop-blur-lg ${colors[type]}`}
        >
          {icons[type]}
          <span className="text-sm text-white">{message}</span>
          <button
            onClick={onClose}
            className="ml-2 p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
