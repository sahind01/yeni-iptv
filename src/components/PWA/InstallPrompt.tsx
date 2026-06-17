'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDownload, FiX } from 'react-icons/fi';

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('Uygulama yüklendi');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-20 left-4 right-4 lg:left-auto lg:right-4 lg:bottom-4 
            lg:w-96 z-50 bg-[#1a1a1a] border border-gray-700 rounded-2xl p-4 shadow-2xl"
        >
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl 
              flex items-center justify-center flex-shrink-0">
              <FiDownload className="w-6 h-6" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold">Mutlu Player'ı Yükle</h3>
              <p className="text-xs text-gray-400 mt-1">
                Daha iyi bir deneyim için uygulamayı ana ekranınıza ekleyin.
              </p>
              
              <div className="flex items-center space-x-2 mt-3">
                <button
                  onClick={handleInstall}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors"
                >
                  Yükle
                </button>
                <button
                  onClick={() => setShowPrompt(false)}
                  className="px-3 py-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
