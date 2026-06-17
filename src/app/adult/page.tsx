'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';
import ChannelGrid from '@/components/Channel/ChannelGrid';
import PinModal from '@/components/UI/PinModal';
import { useStore } from '@/store/useStore';
import { FirebaseService } from '@/services/firebase';
import { M3UParser } from '@/services/m3u-parser';
import type { Channel } from '@/types';

export default function AdultPage() {
  const router = useRouter();
  const { userId, adultVerified, setAdultVerified, channels } = useStore();
  const [showPinModal, setShowPinModal] = useState(false);
  const [adultChannels, setAdultChannels] = useState<Channel[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (channels.length > 0) {
      const adult = channels.filter(channel => {
        const group = channel.group?.toLowerCase() || '';
        return group.includes('adult') || group.includes('xxx') || 
               group.includes('18+') || group.includes('erotik');
      });
      setAdultChannels(adult);
      setIsLoading(false);
    }
  }, [channels]);

  useEffect(() => {
    if (adultVerified) {
      setShowPinModal(false);
    }
  }, [adultVerified]);

  useEffect(() => {
    if (userId) {
      loadFavorites();
    }
  }, [userId]);

  const loadFavorites = async () => {
    if (!userId) return;
    try {
      const favList = await FirebaseService.getFavorites(userId);
      setFavorites(new Set(favList.map(f => f.channelId)));
    } catch (err) {
      console.error('Favori yükleme hatası:', err);
    }
  };

  const handlePinSuccess = useCallback(() => {
    setAdultVerified(true);
    setShowPinModal(false);
  }, []);

  const handleAccess = () => {
    if (adultVerified) {
      // Zaten doğrulanmış
    } else {
      setShowPinModal(true);
    }
  };

  const handleChannelSelect = useCallback(async (channel: Channel) => {
    if (!adultVerified) {
      setShowPinModal(true);
      return;
    }

    useStore.getState().setCurrentChannel(channel);
    
    if (userId) {
      await FirebaseService.addRecentWatch(userId, channel);
    }
    
    router.push('/live-tv');
  }, [adultVerified, userId, router]);

  const handleFavoriteToggle = useCallback(async (channel: Channel) => {
    if (!userId) return;

    try {
      const isFav = favorites.has(channel.id);
      
      if (isFav) {
        await FirebaseService.removeFromFavorites(userId, channel.id);
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(channel.id);
          return next;
        });
      } else {
        await FirebaseService.addToFavorites(userId, channel);
        setFavorites(prev => new Set(prev).add(channel.id));
      }
    } catch (err) {
      console.error('Favori işlemi hatası:', err);
    }
  }, [userId, favorites]);

  return (
    <MainLayout>
      <div className="p-4 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Adult İçerik</h1>
          <p className="text-gray-400 text-sm mt-1">
            {adultChannels.length} kanal
          </p>
        </div>

        {!adultVerified ? (
          /* PIN Girişi Bekleyen Ekran */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-orange-500/20 
              rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">🔞</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Yetişkin İçeriği</h2>
            <p className="text-gray-400 text-center max-w-md mb-6">
              Bu bölüme erişmek için 4 haneli PIN kodunuzu girmeniz gerekiyor.
            </p>
            <button
              onClick={() => setShowPinModal(true)}
              className="px-8 py-3 bg-gradient-to-r from-red-500 to-orange-500 
                rounded-xl font-medium hover:from-red-600 hover:to-orange-600 
                transition-all transform hover:scale-105"
            >
              PIN Gir
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Doğrulanmış İçerik */}
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-between">
              <span className="text-green-400 text-sm">✓ Erişim doğrulandı</span>
              <button
                onClick={() => setAdultVerified(false)}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Kilitle
              </button>
            </div>

            <ChannelGrid
              channels={adultChannels}
              favorites={favorites}
              onChannelSelect={handleChannelSelect}
              onFavoriteToggle={handleFavoriteToggle}
            />
          </>
        )}

        {/* PIN Modal */}
        <PinModal
          isOpen={showPinModal}
          onSuccess={handlePinSuccess}
          onClose={() => setShowPinModal(false)}
        />
      </div>
    </MainLayout>
  );
}
