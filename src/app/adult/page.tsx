'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import VideoPlayer from '@/components/Player/VideoPlayer';
import { useStore } from '@/store/useStore';
import { FirebaseService } from '@/services/firebase';
import { CryptoUtils } from '@/utils/crypto';
import { FiSearch, FiX, FiLock } from 'react-icons/fi';
import { motion } from 'framer-motion';

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
  const [debugInfo, setDebugInfo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCount, setShowCount] = useState(20);
  const [selectedChannel, setSelectedChannel] = useState<AdultChannel | null>(null);
  const { setCurrentChannel, userId } = useStore();

  // PIN
  const [step, setStep] = useState<'loading' | 'create' | 'enter' | 'verified'>('loading');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [savedPin, setSavedPin] = useState<string | null>(null);

  useEffect(() => { initPin(); }, [userId]);
  useEffect(() => { if (step === 'verified') fetchChannels(); }, [step]);

  const initPin = async () => {
    const uid = userId || useStore.getState().userId;
    if (!uid) return;
    const existingPin = await FirebaseService.getAdultPin(uid);
    if (existingPin) {
      setSavedPin(existingPin);
      setStep('enter');
    } else {
      setStep('create');
    }
  };

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setPinError('');
      if (newPin.length === 4) {
        if (step === 'create') {
          saveNewPin(newPin);
        } else {
          verifyPin(newPin);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(p => p.slice(0, -1));
    setPinError('');
  };

  const saveNewPin = async (np: string) => {
    const uid = userId || useStore.getState().userId;
    if (!uid) return;
    const hashed = CryptoUtils.hashPin(np);
    await FirebaseService.setAdultPin(uid, hashed);
    setSavedPin(hashed);
    setStep('verified');
    setPin('');
  };

  const verifyPin = async (ip: string) => {
    if (savedPin && CryptoUtils.verifyPin(ip, savedPin)) {
      setStep('verified');
      setPin('');
    } else {
      setPinError('Hatalı PIN!');
      setPin('');
    }
  };

  const handleResetPin = () => {
    setStep('create');
    setPin('');
    setPinError('');
  };

  const handleLock = () => {
    setStep('enter');
    setPin('');
    setPinError('');
    setSelectedChannel(null);
    setCurrentChannel(null);
    setChannels([]);
  };

  const fetchChannels = async () => {
    try {
      setIsLoading(true);
      setError('');
      setDebugInfo('');

      const res = await fetch('https://gist.githubusercontent.com/alexpekt/dc11067cd5dca6e0dd2b1ee99fd743d5/raw/da511ed0ea129dcc6490fc00a1503b237ad86b0e/IPTV_SHARED.M3U', { cache: 'no-store' });
      
      if (!res.ok) throw new Error('Liste alınamadı');

      const text = await res.text();
      console.log('M3U ilk 500 karakter:', text.substring(0, 500));

      const parsed = parseM3U(text);

      setChannels(parsed);
      setFilteredChannels(parsed);

      if (parsed.length > 0) {
        const sample = parsed.slice(0, 3).map(c => `${c.name}: ${c.url?.substring(0, 50) || 'URL YOK'}...`).join('\n');
        setDebugInfo(`${parsed.length} kanal bulundu.\nİlk 3 kanal:\n${sample}`);
        console.log('İlk kanal URL:', parsed[0]?.url);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const parseM3U = (content: string): AdultChannel[] => {
    const result: AdultChannel[] = [];
    const lines = content.split('\n');
    let cur: any = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('#EXTINF:')) {
        const logo = line.match(/tvg-logo="([^"]*)"/)?.[1] || '';
        const group = line.match(/group-title="([^"]*)"/)?.[1] || 'Diğer';
        const name = line.split(',').pop()?.trim() || `Kanal ${i}`;
        cur = { id: `adult_${i}`, name, logo, group, url: '' };

      } else if (line && (line.startsWith('http://') || line.startsWith('https://')) && cur) {
        cur.url = line;

        const g = (cur.group || '').toLowerCase();
        const n = (cur.name || '').toLowerCase();

        if (g.includes('adult') || g.includes('xxx') || g.includes('18') ||
            g.includes('+18') || g.includes('erotik') || g.includes('porn') ||
            g.includes('yetiskin') || g.includes('yetişkin') ||
            n.includes('adult') || n.includes('xxx') || n.includes('18')) {
          result.push({ ...cur });
        }
        cur = null;
      }
    }

    console.log(`Toplam ${result.length} adult kanal bulundu`);
    return result;
  };

  const handleChannelSelect = (ch: AdultChannel) => {
    console.log('Seçilen kanal URL:', ch.url);

    if (!ch.url || (!ch.url.startsWith('http://') && !ch.url.startsWith('https://'))) {
      setError(`Geçersiz yayın linki: ${ch.url?.substring(0, 50) || 'URL yok'}`);
      return;
    }

    setCurrentChannel({
      id: ch.id,
      name: ch.name,
      logo: ch.logo,
      url: ch.url,
      group: ch.group,
      quality: 'HD',
    });
    setSelectedChannel(ch);
    setError('');
  };

  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    setFilteredChannels(q ? channels.filter(c => c.name.toLowerCase().includes(q)) : channels);
    setShowCount(20);
  }, [searchQuery, channels]);

  const displayed = filteredChannels.slice(0, showCount);
  const hasMore = showCount < filteredChannels.length;

  // LOADING
  if (step === 'loading') {
    return (
      <MainLayout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  // PIN SCREEN
  if (step === 'create' || step === 'enter') {
    return (
      <MainLayout>
        <div className="min-h-[80vh] flex items-center justify-center p-4">
          <div className="w-full max-w-xs text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiLock className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-lg font-semibold mb-1">Yetişkin İçeriği</h2>
            <p className="text-gray-400 text-xs mb-5">
              {step === 'create' ? '4 haneli PIN oluşturun' : 'PIN kodunuzu girin'}
            </p>

            <div className="flex justify-center space-x-3 mb-4">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`w-9 h-9 rounded-full border-2 flex items-center justify-center ${
                    i < pin.length ? 'border-blue-500 bg-blue-500/20 scale-110' : 'border-gray-600'
                  }`}
                >
                  {i < pin.length && <div className="w-2 h-2 bg-blue-400 rounded-full" />}
                </div>
              ))}
            </div>

            {pinError && <p className="text-red-400 text-xs mb-3">{pinError}</p>}

            <div className="space-y-2 mb-4">
              {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', '⌫']].map((row, i) => (
                <div key={i} className="flex justify-center space-x-2">
                  {row.map((num, j) =>
                    num ? (
                      <button
                        key={j}
                        onClick={() => (num === '⌫' ? handleDelete() : handleNumberClick(num))}
                        className="w-14 h-14 flex items-center justify-center bg-white/5 hover:bg-white/10 active:scale-90 rounded-xl text-lg font-semibold"
                      >
                        {num === '⌫' ? '✕' : num}
                      </button>
                    ) : (
                      <div key={j} className="w-14 h-14" />
                    )
                  )}
                </div>
              ))}
            </div>

            {step === 'enter' && (
              <button onClick={handleResetPin} className="text-xs text-gray-500 hover:text-white">
                PIN Sıfırla
              </button>
            )}
          </div>
        </div>
      </MainLayout>
    );
  }

  // PLAYER
  if (selectedChannel) {
    return (
      <MainLayout>
        <div className="p-3 sm:p-4 space-y-4">
          <VideoPlayer onBack={() => { setSelectedChannel(null); setCurrentChannel(null); }} />
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <h2 className="text-base font-semibold">{selectedChannel.name}</h2>
              <p className="text-xs text-gray-400">{selectedChannel.group}</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // CHANNEL LIST
  return (
    <MainLayout>
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">🔞 Adult</h1>
            <p className="text-xs text-gray-400">{channels.length} kanal</p>
          </div>
          <div className="flex space-x-2">
            <button onClick={handleResetPin} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs">
              PIN Değiştir
            </button>
            <button onClick={handleLock} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs">
              Kilitle
            </button>
          </div>
        </div>

        {debugInfo && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-3">
            <p className="text-blue-400 text-xs whitespace-pre-wrap">{debugInfo}</p>
          </div>
        )}

        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Kanal ara..."
            className="w-full bg-[#1a1a1a] border border-gray-700/50 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
              <FiX className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
            {displayed.map(ch => (
              <motion.div
                key={ch.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#1a1a1a] rounded-xl overflow-hidden cursor-pointer hover:bg-[#252525] border border-gray-800/30 active:scale-[0.98] transition-all"
                onClick={() => handleChannelSelect(ch)}
              >
                <div className="aspect-video bg-[#111] flex items-center justify-center p-3 relative">
                  {ch.logo ? (
                    <img
                      src={ch.logo}
                      alt={ch.name}
                      className="max-w-full max-h-full object-contain"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="text-center">
                      <span className="text-2xl">🔞</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-red-500/80 rounded text-[9px]">HD</div>
                  {ch.url && <div className="absolute top-2 left-2 w-2 h-2 bg-green-500 rounded-full" title="Yayın var" />}
                </div>
                <div className="p-2">
                  <h3 className="text-[11px] font-medium text-white truncate">{ch.name}</h3>
                  <p className="text-[9px] text-gray-500 truncate">{ch.group}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="text-center mt-6">
            <button onClick={() => setShowCount(p => p + 20)} className="px-6 py-2.5 bg-[#1a1a1a] border border-gray-700/50 rounded-xl text-sm">
              Daha Fazla
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
