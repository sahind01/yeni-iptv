'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiWifiOff } from 'react-icons/fi';

export default function OfflineNotice() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    setIsOffline(!navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-14 lg:top-0 left-0 right-0 z-40 bg-yellow-500/90 
            backdrop-blur-lg px-4 py-2"
        >
          <div className="flex items-center justify-center space-x-2">
            <FiWifiOff className="w-4 h-4 text-black" />
            <span className="text-sm text-black font-medium">
              İnternet bağlantısı yok. Bazı özellikler kullanılamayabilir.
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
