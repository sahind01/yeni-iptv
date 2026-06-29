'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { FiHeart, FiSend, FiUser, FiShield, FiTrash2, FiX, FiShare2, FiCheck } from 'react-icons/fi';
import { ref, push, onValue, remove, get } from 'firebase/database';
import { db } from '@/services/firebase';

interface Message {
  id: string;
  nick: string;
  text: string;
  time: number;
}

const MAX_MESSAGES = 15;

export default function VideoPlayer({ onBack }: { onBack?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const adRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const { currentChannel } = useStore();

  const [playerState, setPlayerState] = useState({
    isPlaying: false, isMuted: false, volume: 1, currentTime: 0, duration: 0,
    error: null as string | null, showControls: true, isLive: true,
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [nick, setNick] = useState('');
  const [chatText, setChatText] = useState('');
  const [nickSet, setNickSet] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [adminPinError, setAdminPinError] = useState('');
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    const savedNick = localStorage.getItem('mutlu_chat_nick');
    if (savedNick) { setNick(savedNick); setNickSet(true); }
  }, []);

  useEffect(() => {
    if (!currentChannel?.id) return;
    setMessages([]);
    const channelId = currentChannel.id.replace(/[.#$\[\]]/g, '_');
    const chatRef_db = ref(db, `chats/${channelId}`);
    const unsubscribe = onValue(chatRef_db, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const msgs: Message[] = Object.entries(data).map(([key, value]: any) => ({
          id: key, nick: value.nick, text: value.text, time: value.time,
        }));
        msgs.sort((a, b) => a.time - b.time);
        setMessages(msgs);
      } else { setMessages([]); }
    });
    return () => unsubscribe();
  }, [currentChannel?.id]);

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages]);

  useEffect(() => {
    if (adRef.current) {
      adRef.current.innerHTML = '';
      const script = document.createElement('script');
      script.src = 'https://www.highperformanceformat.com/17d00916f28f83916acf6ce35dca6c88/invoke.js';
      script.async = true;
      (window as any).atOptions = { 'key': '17d00916f28f83916acf6ce35dca6c88', 'format': 'iframe', 'height': 50, 'width': 320, 'params': {} };
      adRef.current.appendChild(script);
    }
  }, [currentChannel?.url]);

  // EXO PLAYER - HLS + MP4 + TS + MKV + WEBM HEPSİ
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentChannel?.url) return;

    const url = currentChannel.url.trim();
    const isHLS = url.includes('.m3u8');
    
    setPlayerState(prev => ({ ...prev, error: null }));

    // HLS için Hls.js yükle
    if (isHLS) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
      script.onload = () => {
        const Hls = (window as any).Hls;
        if (Hls && Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            maxBufferLength: 60,
            maxMaxBufferLength: 300,
          });
          hls.loadSource(url);
          hls.attachMedia(video);
          hls.on((window as any).Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => {});
            setPlayerState(prev => ({ ...prev, error: null }));
          });
          hls.on((window as any).Hls.Events.ERROR, () => {
            // HLS hatası - direkt dene
            video.src = url;
            video.load();
            video.play().catch(() => {
              setPlayerState(prev => ({ ...prev, error: 'Yayın açılamadı' }));
            });
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = url;
          video.load();
          video.play().catch(() => {});
        } else {
          video.src = url;
          video.load();
          video.play().catch(() => {});
        }
      };
      document.head.appendChild(script);
    } else {
      // MP4, TS, MKV, WEBM vs direkt
      video.src = url;
      video.load();
      video.play().catch(() => {
        setPlayerState(prev => ({ ...prev, error: 'Başlatmak için tıklayın ▶️' }));
      });
    }

    return () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [currentChannel?.url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setPlayerState(prev => ({ ...prev, isPlaying: true, error: null }));
    const onPause = () => setPlayerState(prev => ({ ...prev, isPlaying: false }));
    const onTimeUpdate = () => { if (video) setPlayerState(prev => ({ ...prev, currentTime: video.currentTime })); };
    const onDuration = () => { if (video) setPlayerState(prev => ({ ...prev, duration: video.duration })); };
    const onVolume = () => { if (video) setPlayerState(prev => ({ ...prev, volume: video.volume, isMuted: video.muted })); };
    const onError = () => setPlayerState(prev => ({ ...prev, error: 'Yayın geçici olarak kullanılamıyor' }));
    const onCanPlay = () => setPlayerState(prev => ({ ...prev, error: null }));

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDuration);
    video.addEventListener('volumechange', onVolume);
    video.addEventListener('error', onError);
    video.addEventListener('canplay', onCanPlay);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDuration);
      video.removeEventListener('volumechange', onVolume);
      video.removeEventListener('error', onError);
      video.removeEventListener('canplay', onCanPlay);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (playerState.isPlaying) { video.pause(); }
    else { video.play().catch(() => {}); }
  };

  const toggleMute = () => { if (videoRef.current) { videoRef.current.muted = !playerState.isMuted; } };
  const toggleFullscreen = () => { document.fullscreenElement ? document.exitFullscreen() : containerRef.current?.requestFullscreen(); };

  const formatTime = (t: number) => {
    if (!isFinite(t) || t < 0) return '0:00';
    const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = Math.floor(t % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = playerState.duration > 0 ? (playerState.currentTime / playerState.duration) * 100 : 0;

  const saveNick = () => { const n = nick.trim(); if (n.length < 2) return; localStorage.setItem('mutlu_chat_nick', n); setNick(n); setNickSet(true); };
  const cleanupOldMessages = async (channelId: string) => {
    const chatRef_db = ref(db, `chats/${channelId}`);
    const snapshot = await get(chatRef_db);
    if (!snapshot.exists()) return;
    const data = snapshot.val();
    const entries = Object.entries(data) as [string, { time: number }][];
    if (entries.length > MAX_MESSAGES) {
      entries.sort((a, b) => a[1].time - b[1].time);
      const deleteCount = entries.length - MAX_MESSAGES;
      for (let i = 0; i < deleteCount; i++) {
        await remove(ref(db, `chats/${channelId}/${entries[i][0]}`));
      }
    }
  };
  const sendMessage = async () => {
    if (!chatText.trim() || !nickSet || !currentChannel?.id) return;
    const channelId = currentChannel.id.replace(/[.#$\[\]]/g, '_');
    await push(ref(db, `chats/${channelId}`), { nick, text: chatText.trim().slice(0, 200), time: Date.now() });
    setChatText('');
    await cleanupOldMessages(channelId);
  };
  const deleteMessage = async (msgId: string) => {
    if (!isAdmin || !currentChannel?.id) return;
    const channelId = currentChannel.id.replace(/[.#$\[\]]/g, '_');
    await remove(ref(db, `chats/${channelId}/${msgId}`));
  };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') { if (!nickSet) saveNick(); else sendMessage(); } };
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: currentChannel?.name || 'Mutlu Player', text: `📺 ${currentChannel?.name} kanalını izliyorum! Sen de katıl! 🎉`, url: window.location.href })
        .catch(() => { navigator.clipboard.writeText(window.location.href); setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); });
    } else { navigator.clipboard.writeText(window.location.href); setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); }
  };

  if (!currentChannel) {
    return <div className="flex items-center justify-center h-48 bg-[#111] rounded-xl"><p className="text-gray-500">Kanal seçilmedi</p></div>;
  }

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="relative w-full bg-black overflow-hidden rounded-xl" style={{ aspectRatio: '16/9' }}>
        <video ref={videoRef} className="w-full h-full object-contain" playsInline autoPlay />

        {!playerState.isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center z-20 cursor-pointer" onClick={togglePlay}>
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
              <span className="text-3xl">{playerState.error ? '🔄' : '▶️'}</span>
            </div>
          </div>
        )}

        <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between">
          {onBack ? <button onClick={onBack} className="px-3 py-1.5 bg-black/50 backdrop-blur rounded-lg text-sm hover:bg-black/70">← Geri</button> : <div />}
          <button onClick={handleShare} className="px-3 py-1.5 bg-black/50 backdrop-blur rounded-lg text-sm hover:bg-black/70 flex items-center gap-1.5">
            {shareCopied ? <><FiCheck className="w-3.5 h-3.5 text-green-400" /><span className="text-xs text-green-400">Kopyalandı!</span></> : <><FiShare2 className="w-3.5 h-3.5" /><span className="text-xs">Paylaş</span></>}
          </button>
        </div>

        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 sm:p-4 pt-10 sm:pt-12 z-20 transition-opacity duration-300 ${playerState.showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {!playerState.isLive && (
            <div className="mb-2"><div className="relative h-1.5 bg-gray-600/50 rounded-full"><div className="absolute h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} /></div>
              <div className="flex justify-between mt-1"><span className="text-[9px] text-gray-400">{formatTime(playerState.currentTime)}</span><span className="text-[9px] text-gray-400">{formatTime(playerState.duration)}</span></div></div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button onClick={togglePlay} className="p-2 hover:bg-white/10 rounded-lg">{playerState.isPlaying ? '⏸' : '▶️'}</button>
              <button onClick={toggleMute} className="p-2 hover:bg-white/10 rounded-lg">{playerState.isMuted ? '🔇' : '🔊'}</button>
            </div>
            <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-lg">⛶</button>
          </div>
        </div>
      </div>

      {/* REKLAM */}
      <div className="bg-[#1a1a1a] border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 border-b border-gray-700/30">
          <div className="flex items-center gap-3"><span className="text-2xl">🎁</span><div><p className="text-xs text-white font-semibold">Bu yayınları ücretsiz izliyorsun!</p><p className="text-[10px] text-yellow-400/80 mt-0.5">Bize destek olmak için aşağıdaki reklama tıklar mısın? ✨</p></div></div>
          <FiHeart className="w-5 h-5 text-red-400 animate-pulse flex-shrink-0" />
        </div>
        <div className="p-3 flex justify-center bg-[#111]" ref={adRef} />
      </div>

      {/* SOHBET */}
      <div className="bg-[#1a1a1a] border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="px-3 py-2 flex items-center justify-between bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-gray-700/30">
          <div className="flex items-center gap-2"><p className="text-[11px] text-white font-medium">💬 Kanal Sohbeti</p>{isAdmin && <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">ADMIN</span>}</div>
          <div className="flex items-center gap-2">
            {!isAdmin && <button onClick={() => setShowAdminLogin(true)} className="text-[10px] text-gray-500 hover:text-white"><FiShield className="w-3 h-3" /></button>}
            {isAdmin && <button onClick={() => setIsAdmin(false)} className="text-[10px] text-red-400 hover:text-red-300">Çık</button>}
            <button onClick={() => setShowChat(!showChat)} className="text-[10px] text-gray-400 hover:text-white">{showChat ? 'Gizle' : 'Göster'}</button>
          </div>
        </div>
        {showChat && (
          <>
            <div ref={chatRef} className="h-40 sm:h-48 overflow-y-auto p-2 sm:p-3 space-y-1.5 bg-[#111]">
              {messages.length === 0 && <p className="text-[10px] text-gray-500 text-center py-4">Henüz mesaj yok</p>}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-1.5 items-start ${msg.nick === nick ? 'justify-end' : ''}`}>
                  <div className={`max-w-[80%] rounded-lg px-2.5 py-1.5 ${msg.nick === nick ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/5 border border-gray-700/30'}`}>
                    {msg.nick !== nick && <p className="text-[9px] text-blue-400 font-medium">{msg.nick}</p>}
                    <p className="text-[11px] text-white break-words">{msg.text}</p>
                  </div>
                  {isAdmin && <button onClick={() => deleteMessage(msg.id)} className="text-red-400 hover:text-red-300 flex-shrink-0 mt-0.5"><FiTrash2 className="w-3 h-3" /></button>}
                </div>
              ))}
            </div>
            <div className="p-2 bg-[#0f0f0f] border-t border-gray-700/30">
              {!nickSet ? (
                <div className="flex items-center gap-2"><FiUser className="w-4 h-4 text-gray-500 flex-shrink-0" /><input type="text" value={nick} onChange={(e) => setNick(e.target.value.slice(0, 15))} onKeyDown={handleKeyDown} placeholder="Nick belirle..." className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" maxLength={15} /><button onClick={saveNick} className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-xs font-medium">Kaydet</button></div>
              ) : (
                <div className="flex items-center gap-2"><input type="text" value={chatText} onChange={(e) => setChatText(e.target.value)} onKeyDown={handleKeyDown} placeholder="Mesaj yaz..." className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" maxLength={200} /><button onClick={sendMessage} disabled={!chatText.trim()} className="p-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-30 rounded-lg"><FiSend className="w-3.5 h-3.5" /></button></div>
              )}
            </div>
          </>
        )}
      </div>

      {showAdminLogin && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => { setShowAdminLogin(false); setAdminPin(''); setAdminPinError(''); }}>
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-2xl p-5 w-full max-w-xs" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold flex items-center gap-2"><FiShield className="text-red-400" /> Admin Girişi</h3><button onClick={() => { setShowAdminLogin(false); setAdminPin(''); setAdminPinError(''); }}><FiX className="w-4 h-4" /></button></div>
            <div className="flex justify-center space-x-2 mb-3">{[0,1,2,3].map(i => (<div key={i} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${i < adminPin.length ? 'border-red-500 bg-red-500/20' : 'border-gray-600'}`}>{i < adminPin.length && <div className="w-2 h-2 bg-red-400 rounded-full" />}</div>))}</div>
            {adminPinError && <p className="text-red-400 text-xs text-center mb-3">{adminPinError}</p>}
            <div className="space-y-2">
              {[['1','2','3'],['4','5','6'],['7','8','9'],['','0','⌫']].map((row, i) => (
                <div key={i} className="flex justify-center space-x-2">
                  {row.map((num, j) => num ? (
                    <button key={j} onClick={() => { if (num === '⌫') { setAdminPin(p => p.slice(0, -1)); setAdminPinError(''); } else if (adminPin.length < 4) { const np = adminPin + num; setAdminPin(np); setAdminPinError(''); if (np.length === 4) { if (np === '0142') { setIsAdmin(true); setShowAdminLogin(false); setAdminPin(''); } else { setAdminPinError('Hatalı PIN!'); setAdminPin(''); } } } }} className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 active:scale-90 rounded-xl text-base font-semibold">{num === '⌫' ? '✕' : num}</button>
                  ) : <div key={j} className="w-12 h-12" />)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
