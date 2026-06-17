'use client';

import { motion } from 'framer-motion';

export default function SplashScreen() {
  return (
    <div className="splash-screen">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: 'spring', 
          stiffness: 200, 
          damping: 15 
        }}
        className="text-center"
      >
        {/* Logo */}
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 0],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: 'easeInOut' 
          }}
          className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 
            rounded-3xl flex items-center justify-center mx-auto mb-6
            shadow-2xl shadow-blue-500/20"
        >
          <span className="text-4xl">📺</span>
        </motion.div>

        {/* Başlık */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold"
        >
          <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Mutlu Player
          </span>
        </motion.h1>
        
        {/* Alt başlık */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-gray-500 mt-2 text-sm"
        >
          Premium IPTV Deneyimi
        </motion.p>

        {/* Loading */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8"
        >
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 
            rounded-full animate-spin mx-auto" />
        </motion.div>
      </motion.div>
    </div>
  );
}
