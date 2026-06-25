'use client';

import { useRef } from 'react';
import { useStore } from '@/store/useStore';

export default function VodPlayer({ onBack }: { onBack?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentChannel } = useStore();

  if (!currentChannel) {
    return <div className="flex items-center justify-center h-48 bg-[#111] rounded-xl"><p className="text-gray-500">İçerik seçilmedi</p></div>;
  }

  return (
    <div ref={containerRef} className="relative w-full bg-black overflow-hidden rounded-xl" style={{ aspectRatio: '16/9' }}>
      {onBack && (
        <div className="absolute top-3 left-3 z-30">
          <button onClick={onBack} className="px-3 py-1.5 bg-black/50 backdrop-blur rounded-lg text-sm hover:bg-black/70">← Geri</button>
        </div>
      )}
      
      <iframe
        src={currentChannel.url}
        className="w-full h-full"
        allow="autoplay; fullscreen"
        allowFullScreen
        title="Film Player"
      />
    </div>
  );
}
