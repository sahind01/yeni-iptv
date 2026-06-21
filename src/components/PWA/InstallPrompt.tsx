'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDownload, FiX, FiSmartphone } from 'react-icons/fi';

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    const ios = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    setIsIOS(ios);
    
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(standalone);

    if (standalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // iOS için 3 saniye sonra göster
    if (ios) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    // Android için 5 saniye içinde event gelmezse manuel göster
    setTimeout(() => {
      if (!deferredPrompt && !ios) {
        setShowPrompt(true);
      }
    }, 5000);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('Kurulum:', outcome);
        if (outcome === 'accepted') {
          setShowPrompt(false);
        }
      } catch (e) {
        console.log('Kurulum hatası:', e);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Manuel tarif
      alert('Tarayıcı menüsünden (⋮) "Ana Ekrana Ekle" veya "Uygulama Yükle" seçeneğini kullanın.');
    }
  };

  if (isStandalone) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: -60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -60 }}
          className="fixed top-4 right-4 z-[200] w-[calc(100%-32px)] max-w-[360px]"
        >
          {showIOSGuide ? (
            <div className="bg-[#1a1a1a] border border-gray-700 rounded-2xl p-4 shadow-2xl">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FiSmartphone className="text-blue-400" /> iOS Kurulum
                </h3>
                <button onClick={() => { setShowPrompt(false); setShowIOSGuide(false); }} className="text-gray-500 hover:text-white">
                  <FiX className="w-4 h-4" />
                </button>
              </div>
              <ol className="text-xs text-gray-300 space-y-2">
                <li>1. Safari'de paylaş butonuna <span className="text-blue-400">📤</span> tıkla</li>
                <li>2. "<span className="text-white font-medium">Ana Ekrana Ekle</span>" seç</li>
                <li>3. "<span className="text-white font-medium">Ekle</span>" ye tıkla</li>
              </ol>
              <button onClick={() => { setShowPrompt(false); setShowIOSGuide(false); }} className="w-full mt-3 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-xs font-medium">
                Anladım
              </button>
            </div>
          ) : (
            <div className="bg-[#1a1a1a] border border-gray-700 rounded-2xl p-4 shadow-2xl">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FiDownload className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white">Uygulamayı Yükle</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {isIOS ? 'Ana ekrana ekleyin' : 'Daha iyi deneyim için ana ekrana ekleyin'}
                  </p>
                  <div className="flex items-center space-x-2 mt-3">
                    <button 
                      onClick={handleInstall} 
                      className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <FiDownload className="w-4 h-4" />
                      <span>{isIOS ? 'Nasıl Yapılır?' : '📱 Yükle'}</span>
                    </button>
                    <button onClick={() => setShowPrompt(false)} className="px-3 py-2.5 hover:bg-white/5 rounded-lg transition-all">
                      <FiX className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
