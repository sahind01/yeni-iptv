'use client';

import { useRouter, usePathname } from 'next/navigation';
import { FiHome, FiTv, FiHeart, FiSettings } from 'react-icons/fi';
import { motion } from 'framer-motion';

const navItems = [
  { id: 'dashboard', label: 'Ana Sayfa', icon: FiHome, path: '/dashboard' },
  { id: 'live-tv', label: 'Canlı TV', icon: FiTv, path: '/live-tv' },
  { id: 'favorites', label: 'Favoriler', icon: FiHeart, path: '/favorites' },
  { id: 'settings', label: 'Ayarlar', icon: FiSettings, path: '/settings' },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0f0f0f]/95 backdrop-blur-lg 
      border-t border-gray-800/50 z-30 lg:hidden pwa-safe-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center justify-center space-y-1 
                relative px-3 py-1"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNav"
                  className="absolute -top-0.5 w-8 h-0.5 bg-blue-500 rounded-full"
                />
              )}
              <item.icon className={`w-5 h-5 ${
                isActive ? 'text-blue-400' : 'text-gray-500'
              }`} />
              <span className={`text-[10px] ${
                isActive ? 'text-blue-400' : 'text-gray-500'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
