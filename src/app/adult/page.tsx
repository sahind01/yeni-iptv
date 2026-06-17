'use client';

import { useEffect, useState, useCallback } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import VideoPlayer from '@/components/Player/VideoPlayer';
import { useStore } from '@/store/useStore';
import { FirebaseService } from '@/services/firebase';
import { CryptoUtils } from '@/utils/crypto';
import { FiSearch, FiX, FiLock, FiEye, FiEyeOff, FiTrash2, FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

interface AdultChannel {
  id: string;
  name: string;
  logo: string;
  url: string;
  group: string;
}

export default function AdultPage() {
  const [channels, setChannels] = useState<AdultChannel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<AdultChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCount, setShowCount] = useState(20);
  const [selectedChannel, setSelectedChannel] = useState<AdultChannel | null>(null);
  const { username, password, setCurrentChannel, userId } = useStore();

  // PIN State
  const [pinVerified, setPinVerified] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPinScreen, setShowPinScreen] = useState(true);
  const [showChangePin, setShowChangePin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');
  const [showPinInput, setShowPinInput] = useState(true);

  useEffect(() => {
    checkPin();
  }, [userId]);

  useEffect(() => {
    if (pinVerified) {
      fetchChannels();
    }
  }, [pinVerified]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      setFilteredChannels(channels.filter(c => c.name.toLowerCase().includes(q)));
    } else {
      setFilteredChannels(channels);
    }
    setShowCount(20);
  }, [searchQuery, channels]);

  const checkPin = async () => {
    const uid = userId || useStore.getState().userId;
    if (!uid) return;

    const savedPin = await FirebaseService.getAdultPin(uid);
    if (savedPin) {
      setHasPin(true);
    } else {
      // İlk giriş - varsayılan PIN 1590
      const defaultHashed = CryptoUtils.hashPin('1590');
      await FirebaseService.setAdultPin(uid, defaultHashed);
      setHasPin(true);
    }
  };

  const handlePinSubmit = async () => {
    const uid = userId || useStore.getState().userId;
    if (!uid) return;

    setPinError('');
    const savedPin = await FirebaseService.getAdultPin(uid);

    if (savedPin && CryptoUtils.verifyPin(pinInput, savedPin)) {
      setPinVerified(true);
      setShowPinScreen(false);
    } else {
      setPinError('Hatalı PIN!');
      setPinInput('');
    }
  };

  const handleChangePin = async () => {
    if (newPin.length !== 4) {
      setPinError('PIN 4 haneli olmalı');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PIN\'ler eşleşmiyor');
      return;
    }

    const uid = userId || useStore.getState().userId;
    if (!uid) return;

    const hashed = CryptoUtils.hashPin(newPin);
    await FirebaseService.setAdultPin(uid, hashed);
    setPinSuccess('PIN başarıyla değiştirildi!');
    setNewPin('');
    setConfirmPin('');
    setTimeout(() => {
      setShowChangePin(false);
      setPinSuccess('');
    }, 1500);
  };

  const fetchChannels = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('https://gist.githubusercontent.com/alexpekt/dc11067cd5dca6e0dd2b1ee99fd743d5/raw/da511ed0ea129dcc6490fc00a1503b237ad86b0e/IPTV_SHARED.M3U', {
        cache: 'no-store'
      });

      if (!response.ok) throw new Error('Liste alınamadı');

      const m3uContent = await response.text();
      const parsed = parseM3U(m3uContent);

      if (parsed.length === 0) {
        setError('Kanal bulunamadı');
      } else {
        setChannels(parsed);
        setFilteredChannels(parsed);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const parseM3U = (content: string): AdultChannel[] => {
    const channels: AdultChannel[] = [];
    const lines = content.split('\n').map(l => l.trim());
    let current: Partial<AdultChannel> = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('#EXTINF:')) {
        const logoMatch = line.match(/tvg-logo="([^"]*)"/);
        const groupMatch = line.match(/group-title="([^"]*)"/);
        const nameParts = line.split(',');
        const displayName = nameParts.length > 1 ? nameParts[nameParts.length - 1].trim() : '';

        current = {
          id: `adult_${i}`,
          name: displayName || 'Kanal',
          logo: logoMatch?.[1] || '',
          group: groupMatch?.[1] || 'Adult',
          url: '',
        };
      } else if ((line.startsWith('http://') || line.startsWith('https://')) && current.name) {
        current.url = line;
        const group = (current.group || '').toLowerCase();
        if (group.includes('adult') || group.includes('xxx') || group.includes('18') || 
            group.includes('+18') || group.includes('erotik') || group.includes('porn')) {
          channels.push(current as AdultChannel);
        }
        current = {};
      }
    }

    return channels;
  };

  const handleChannelSelect = (channel: AdultChannel) => {
    setCurrentChannel({
      id: channel.id,
      name: channel.name,
      logo: channel.logo,
      url: channel.url,
      group: channel.group,
      quality: 'HD',
    });
    setSelectedChannel(channel);
  };

  const handleBackFromPlayer = () => {
    setSelectedChannel(null);
    setCurrentChannel(null);
  };

  const loadMore = () => {
    setShowCount(prev => prev + 20);
  };

  const handleLogout = () => {
    setPinVerified(false);
    setShowPinScreen(true);
    setPinInput('');
    setSelectedChannel(null);
    setCurrentChannel(null);
  };

  const displayedChannels = filteredChannels.slice(0, showCount);
  const hasMore = showCount < filteredChannels.length;

  // PIN Ekranı
  if (!pinVerified && showPinScreen) {
    return (
      <MainLayout>
        <div className="min-h-[80vh] flex items-center justify-center p-4">
          <div className="w-full max-w-sm text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiLock className="w-10 h-10 text-red-400" />
            </div>
            
            <h2 className="text-xl font-semibold mb-2">Yetişkin İçeriği</h2>
            <p className="text-gray-400 text-sm mb-6">
              {hasPin ? 'Devam etmek için PIN giriniz' : 'Varsayılan PIN: 1590'}
            </p>

            {/* PIN Göstergesi */}
            <div className="flex justify-center space-x-3 mb-6">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                    i < pinInput.length ? 'border-blue-500 bg-blue-500/20' : 'border-gray-600'
                  }`}
                >
                  {i < pinInput.length && <div className="w-2.5 h-2.5 bg-blue-400 rounded-full" />}
                </div>
              ))}
            </div>

            {pinError && (
              <p className="text-red-400 text-sm mb-4">{pinError}</p>
            )}

            {/* NumPad */}
            <div className="space-y-2 mb-4">
              {[
                ['1', '2', '3'],
                ['4', '5', '6'],
                ['7', '8', '9'],
                ['', '0', '⌫'],
              ].map((row, i) => (
                <div key={i} className="flex justify-center space-x-2">
                  {row.map((num, j) => (
                    <button
                      key={j}
                      onClick={() => {
                        if (num === '⌫') {
                          setPinInput(prev => prev.slice(0, -1));
                        } else if (num && pinInput.length < 4) {
                          const newInput = pinInput + num;
                          setPinInput(newInput);
                          if (newInput.length === 4) {
                            setTimeout(() => handlePinSubmit(), 200);
                          }
                        }
                      }}
                      className={`w-14 h-14 flex items-center justify-center rounded-xl text-lg font-semibold
                        ${num ? 'bg-white/5 hover:bg-white/10 active:scale-95' : ''} transition-all`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* Butonlar */}
            <div className="space-y-2">
              <button
                onClick={handlePinSubmit}
                disabled={pinInput.length !== 4}
                className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-30 rounded-xl text-sm font-medium transition-all"
              >
                Giriş Yap
              </button>
              <button
                onClick={() => setShowChangePin(true)}
                className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                PIN Değiştir
              </button>
            </div>
          </div>
        </div>

        {/* PIN Değiştir Modal */}
        <AnimatePresence>
          {showChangePin && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
              onClick={() => { setShowChangePin(false); setPinError(''); setPinSuccess(''); }}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="bg-[#1a1a1a] border border-gray-700 rounded-2xl p-6 w-full max-w-sm"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-4">PIN Değiştir</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Yeni PIN (4 hane)</label>
                    <div className="relative">
                      <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="password"
                        maxLength={4}
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="w-full bg-[#111] border border-gray-700 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white"
                        placeholder="****"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">PIN Tekrar</label>
                    <div className="relative">
                      <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="password"
                        maxLength={4}
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="w-full bg-[#111] border border-gray-700 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white"
                        placeholder="****"
                      />
                    </div>
                  </div>
                </div>

                {pinError && <p className="text-red-400 text-xs mt-2">{pinError}</p>}
                {pinSuccess && <p className="text-green-400 text-xs mt-2">{pinSuccess}</p>}

                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => { setShowChangePin(false); setPinError(''); setPinSuccess(''); }}
                    className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleChangePin}
                    className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl text-sm font-medium"
                  >
                    Kaydet
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </MainLayout>
    );
  }

  // Player açıkken
  if (selectedChannel) {
    return (
      <MainLayout>
        <div className="p-3 sm:p-4 space-y-4">
          <VideoPlayer onBack={handleBackFromPlayer} />
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <h2 className="text-base sm:text-lg font-semibold">{selectedChannel.name}</h2>
              <p className="text-xs sm:text-sm text-gray-400">{selectedChannel.group}</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Kanal Listesi
  return (
    <MainLayout>
      <div className="p-3 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              🔞 Adult
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              {channels.length} kanal
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowChangePin(true)}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs transition-colors"
            >
              PIN Değiştir
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition-colors"
            >
              Kilitle
            </button>
          </div>
        </div>

        {/* Arama */}
        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Kanal ara..."
            className="w-full bg-[#1a1a1a] border border-gray-700/50 rounded-xl pl-10 pr-10 py-2.5 text-sm
              text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-lg"
            >
              <FiX className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Hata */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
            <p className="text-red-400 text-sm">{error}</p>
            <button onClick={fetchChannels} className="mt-2 px-4 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs">
              Tekrar Dene
            </button>
          </div>
        )}

        {/* Yükleniyor */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-3" />
            <p className="text-gray-500 text-sm">Kanallar yükleniyor...</p>
          </div>
        )}

        {/* Kanal Grid */}
        {!isLoading && !error && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
              <AnimatePresence>
                {displayedChannels.map((channel) => (
                  <motion.div
                    key={channel.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-[#1a1a1a] rounded-xl overflow-hidden cursor-pointer 
                      hover:bg-[#252525] border border-gray-800/30 hover:border-gray-700/50
                      active:scale-[0.98] transition-all duration-150"
                    onClick={() => handleChannelSelect(channel)}
                  >
                    <div className="aspect-video bg-[#111] flex items-center justify-center p-3 relative">
                      {channel.logo ? (
                        <img
                          src={channel.logo}
                          alt={channel.name}
                          className="max-w-full max-h-full object-contain"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : null}
                      <div className={`${channel.logo ? 'hidden' : ''} flex flex-col items-center`}>
                        <span className="text-2xl mb-1">🔞</span>
                        <span className="text-[10px] text-gray-500 text-center px-2 line-clamp-2">
                          {channel.name}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-red-500/80 rounded text-[9px] font-medium">
                        HD
                      </div>
                    </div>
                    
                    <div className="p-2 sm:p-3">
                      <h3 className="text-[11px] sm:text-xs font-medium text-white truncate">
                        {channel.name}
                      </h3>
                      <p className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5">
                        {channel.group}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {hasMore && (
              <div className="text-center mt-6">
                <button
                  onClick={loadMore}
                  className="px-6 py-2.5 bg-[#1a1a1a] hover:bg-[#252525] border border-gray-700/50 
                    rounded-xl text-sm text-gray-300 transition-colors"
                >
                  Daha Fazla ({filteredChannels.length - showCount} kanal kaldı)
                </button>
              </div>
            )}

            {filteredChannels.length === 0 && !isLoading && (
              <div className="text-center py-20">
                <span className="text-4xl mb-3 block">🔞</span>
                <p className="text-gray-400 text-sm">Kanal bulunamadı</p>
              </div>
            )}
          </>
        )}

        {/* PIN Değiştir Modal */}
        <AnimatePresence>
          {showChangePin && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
              onClick={() => { setShowChangePin(false); setPinError(''); setPinSuccess(''); }}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="bg-[#1a1a1a] border border-gray-700 rounded-2xl p-6 w-full max-w-sm"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-4">PIN Değiştir</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Yeni PIN (4 hane)</label>
                    <div className="relative">
                      <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="password"
                        maxLength={4}
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="w-full bg-[#111] border border-gray-700 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white"
                        placeholder="****"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">PIN Tekrar</label>
                    <div className="relative">
                      <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="password"
                        maxLength={4}
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="w-full bg-[#111] border border-gray-700 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white"
                        placeholder="****"
                      />
                    </div>
                  </div>
                </div>

                {pinError && <p className="text-red-400 text-xs mt-2">{pinError}</p>}
                {pinSuccess && <p className="text-green-400 text-xs mt-2">{pinSuccess}</p>}

                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => { setShowChangePin(false); setPinError(''); setPinSuccess(''); }}
                    className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleChangePin}
                    className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl text-sm font-medium"
                  >
                    Kaydet
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}
