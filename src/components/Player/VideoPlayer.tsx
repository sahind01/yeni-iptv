'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useStore } from '@/store/useStore';
import { FiHeart, FiSend, FiUser } from 'react-icons/fi';
import { ref, push, onValue, set, serverTimestamp } from 'firebase/database';
import { db } from '@/services/firebase';

interface Message {
  id: string;
  nick: string;
  text: string;
  time: number;
}

export default function VideoPlayer({ onBack }: { onBack?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimer = useRef<NodeJS.Timeout | null>(null);
  const adRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const { currentChannel } = useStore();

  const [playerState, setPlayerState] = useState({
    isPlaying: false, isMuted: false, volume: 1, currentTime: 0, duration: 0,
    quality: 'auto', error: null as string | null, showControls: true, isLive: true,
  });

  // Sohbet state
  const [messages, setMessages] = useState<Message[]>([]);
  const [nick, setNick] = useState('');
  const [chatText, setChatText] = useState('');
  const [nickSet, setNickSet] = useState(false);
  const [showChat, setShowChat] = useState(true);

  // LocalStorage'dan nick al
  useEffect(() => {
    const savedNick = localStorage.getItem('mutlu_chat_nick');
    if (savedNick) {
      setNick(savedNick);
      setNickSet(true);
    }
  }, []);

  // Kanal değişince sohbeti temizle ve yeniden dinle
  useEffect(() => {
    if (!currentChannel?.id) return;
    
    setMessages([]);
    const channelId = currentChannel.id.replace(/[.#$\[\]]/g, '_');
    const chatRef_db = ref(db, `chats/${channelId}`);
    
    const unsubscribe = onValue(chatRef_db, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const msgs: Message[] = Object.entries(data).map(([key, value]: any) => ({
          id: key,
          nick: value.nick,
          text: value.text,
          time: value.time,
        }));
        msgs.sort((a, b) => a.time - b.time);
        setMessages(msgs.slice(-100)); // Son 100 mesaj
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [currentChannel?.id]);

  // Yeni mesaj gelince scroll
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // Reklam
  useEffect(() => {
    if (adRef.current) {
      adRef.current.innerHTML = '';
      const script = document.createElement('script');
      script.src = 'https://www.highperformanceformat.com/17d00916f28f83916acf6ce35dca6c88/invoke.js';
      script.async = true;
      (window as any).atOptions = {
        'key': '17d00916f28f83916acf6ce35dca6c88',
        'format': 'iframe', 'height': 50, 'width': 320, 'params': {}
      };
      adRef.current.appendChild(script);
    }
  }, [currentChannel?.url]);

  // HLS Player
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentChannel?.url) return;
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    const url = currentChannel.url;
    const isLiveStream = url.includes('.m3u8') && (url.includes('live') || url.includes('stream') || url.includes('tv') || url.includes('channel'));
    setPlayerState(prev => ({ ...prev, isLive: isLiveStream }));

    if (url.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true, maxBufferLength: 30 });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}); setPlayerState(prev => ({ ...prev, error: null })); });
      hls.on(Hls.Events.ERROR, () => { video.src = url; video.load(); video.play().catch(() => {}); });
    } else { video.src = url; video.load(); video.play().catch(() => { setPlayerState(prev => ({ ...prev, error: 'Yayın açılamadı' })); }); }
    return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
  }, [currentChannel?.url]);

  useEffect(() => {
    const video = videoRef.current; if (!video) return;
    const onPlay = () => setPlayerState(prev => ({ ...prev, isPlaying: true, error: null }));
    const onPause = () => setPlayerState(prev => ({ ...prev, isPlaying: false }));
    const onTimeUpdate = () => setPlayerState(prev => ({ ...prev, currentTime: video.currentTime }));
    const onDuration = () => setPlayerState(prev => ({ ...prev, duration: video.duration }));
    const onVolume = () => setPlayerState(prev => ({ ...prev, volume: video.volume, isMuted: video.muted }));
    const onError = () => setPlayerState(prev => ({ ...prev, error: 'Yayın geçici olarak kullanılamıyor' }));
    const onCanPlay = () => setPlayerState(prev => ({ ...prev, error: null }));
    video.addEventListener('play', onPlay); video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate); video.addEventListener('durationchange', onDuration);
    video.addEventListener('volumechange', onVolume); video.addEventListener('error', onError);
    video.addEventListener('canplay', onCanPlay);
    return () => {
      video.removeEventListener('play', onPlay); video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate); video.removeEventListener('durationchange', onDuration);
      video.removeEventListener('volumechange', onVolume); video.removeEventListener('error', onError);
      video.removeEventListener('canplay', onCanPlay);
    };
  }, []);

  const resetControlsTimer = () => {
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    setPlayerState(prev => ({ ...prev, showControls: true }));
    controlsTimer.current = setTimeout(() => { setPlayerState(prev => ({ ...prev, showControls: false })); }, 5000);
  };

  useEffect(() => {
    const container = containerRef.current; if (!container) return;
    const show = () => resetControlsTimer();
    container.addEventListener('mousemove', show); container.addEventListener('touchstart', show); container.addEventListener('click', show);
    return () => { container.removeEventListener('mousemove', show); container.removeEventListener('touchstart', show); container.removeEventListener('click', show); };
  }, []);

  const togglePlay = () => { if (videoRef.current) { videoRef.current[playerState.isPlaying ? 'pause' : 'play'](); resetControlsTimer(); } };
  const toggleMute = () => { if (videoRef.current) { videoRef.current.muted = !playerState.isMuted; resetControlsTimer(); } };
  const toggleFullscreen = () => { document.fullscreenElement ? document.exitFullscreen() : containerRef.current?.requestFullscreen(); resetControlsTimer(); };
  const skipTime = (s: number) => { if (videoRef.current) { videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + s)); resetControlsTimer(); } };

  const formatTime = (t: number) => {
    if (!isFinite(t) || t < 0) return '0:00';
    const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = Math.floor(t % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !playerState.duration) return;
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    videoRef.current.currentTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * playerState.duration;
    resetControlsTimer();
  };

  // Nick kaydet
  const saveNick = () => {
    const n = nick.trim();
    if (n.length < 2) return;
    localStorage.setItem('mutlu_chat_nick', n);
    setNick(n);
    setNickSet(true);
  };

  // Mesaj gönder
  const sendMessage = async () => {
    if (!chatText.trim() || !nickSet || !currentChannel?.id) return;
    const channelId = currentChannel.id.replace(/[.#$\[\]]/g, '_');
    const chatRef_db = ref(db, `chats/${channelId}`);
    await push(chatRef_db, {
      nick: nick,
      text: chatText.trim().slice(0, 200),
      time: Date.now(),
    });
    setChatText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (!nickSet) saveNick();
      else sendMessage();
    }
  };

  const progress = playerState.duration > 0 ? (playerState.currentTime / playerState.duration) * 100 : 0;

  if (!currentChannel) {
    return <div className="flex items-center justify-center h-48 bg-[#111] rounded-xl"><p className="text-gray-500">Kanal seçilmedi</p></div>;
  }

  return (
    <div className="space-y-2">
      {/* PLAYER */}
      <div ref={containerRef} className="relative w-full bg-black overflow-hidden rounded-xl" style={{ aspectRatio: '16/9' }}>
        <video ref={videoRef} className="w-full h-full object-contain" playsInline autoPlay />
        {playerState.error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
            <div className="text-center">
              <p className="text-gray-300 text-sm mb-3">{playerState.error}</p>
              <button onClick={() => { if (videoRef.current) { videoRef.current.load(); videoRef.current.play().catch(() => {}); } }} className="px-5 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm">Tekrar Dene</button>
            </div>
          </div>
        )}
        {onBack && (
          <div className="absolute top-3 left-3 z-30">
            <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="px-3 py-1.5 bg-black/50 backdrop-blur rounded-lg text-sm hover:bg-black/70">← Geri</button>
          </div>
        )}
        {playerState.showControls && (
          <div className="absolute top-3 right-3 z-20">
            <p className="text-xs bg-black/50 backdrop-blur px-3 py-1.5 rounded-lg text-white/80">{currentChannel.name}</p>
          </div>
        )}
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 sm:p-4 pt-10 sm:pt-12 z-20 transition-opacity duration-300 ${playerState.showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {!playerState.isLive && (
            <div className="mb-2 sm:mb-3">
              <div className="relative h-1.5 sm:h-2 bg-gray-600/50 rounded-full cursor-pointer" onClick={handleSeek}>
                <div className="absolute h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
                <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-lg" style={{ left: `${progress}%`, marginLeft: -6 }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] sm:text-[10px] text-gray-400">{formatTime(playerState.currentTime)}</span>
                <span className="text-[9px] sm:text-[10px] text-gray-400">{formatTime(playerState.duration)}</span>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 sm:space-x-2">
              {!playerState.isLive && <button onClick={() => skipTime(-10)} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg text-xs sm:text-sm">⏪</button>}
              <button onClick={togglePlay} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg text-base sm:text-lg">{playerState.isPlaying ? '⏸' : '▶️'}</button>
              {!playerState.isLive && <button onClick={() => skipTime(10)} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg text-xs sm:text-sm">⏩</button>}
              <button onClick={toggleMute} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg">{playerState.isMuted || playerState.volume === 0 ? '🔇' : '🔊'}</button>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              {!playerState.isLive && <span className="text-[9px] sm:text-xs text-gray-400">{formatTime(playerState.currentTime)} / {formatTime(playerState.duration)}</span>}
              <button onClick={toggleFullscreen} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg text-base sm:text-lg">⛶</button>
            </div>
          </div>
        </div>
      </div>

      {/* REKLAM */}
      <div className="bg-[#1a1a1a] border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="px-3 sm:px-4 py-2 flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-gray-700/30">
          <div className="flex items-center gap-2">
            <span className="text-base">🙏</span>
            <p className="text-[11px] text-white font-medium">Reklama tıklayarak destek ol!</p>
          </div>
          <FiHeart className="w-4 h-4 text-red-400 animate-pulse" />
        </div>
        <div className="p-2 flex justify-center bg-[#111]" ref={adRef} />
      </div>

      {/* SOHBET */}
      <div className="bg-[#1a1a1a] border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="px-3 sm:px-4 py-2 flex items-center justify-between bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-gray-700/30">
          <p className="text-[11px] sm:text-xs text-white font-medium">💬 Kanal Sohbeti</p>
          <button onClick={() => setShowChat(!showChat)} className="text-[10px] text-gray-400 hover:text-white">
            {showChat ? 'Gizle' : 'Göster'}
          </button>
        </div>

        {showChat && (
          <>
            {/* Mesajlar */}
            <div ref={chatRef} className="h-40 sm:h-48 overflow-y-auto p-2 sm:p-3 space-y-1.5 bg-[#111]">
              {messages.length === 0 && (
                <p className="text-[10px] text-gray-500 text-center py-4">Henüz mesaj yok. İlk mesajı sen gönder!</p>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-1.5 ${msg.nick === nick ? 'justify-end' : ''}`}>
                  {msg.nick !== nick && (
                    <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-[8px] text-gray-300">{msg.nick.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div className={`max-w-[80%] ${msg.nick === nick ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/5 border border-gray-700/30'} rounded-lg px-2.5 py-1.5`}>
                    {msg.nick !== nick && <p className="text-[9px] text-blue-400 font-medium">{msg.nick}</p>}
                    <p className="text-[11px] text-white break-words">{msg.text}</p>
                  </div>
                  {msg.nick === nick && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-[8px] text-white">{msg.nick.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Giriş */}
            <div className="p-2 sm:p-3 bg-[#0f0f0f] border-t border-gray-700/30">
              {!nickSet ? (
                <div className="flex items-center gap-2">
                  <FiUser className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <input
                    type="text"
                    value={nick}
                    onChange={(e) => setNick(e.target.value.slice(0, 15))}
                    onKeyDown={handleKeyDown}
                    placeholder="Nick belirle..."
                    className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    maxLength={15}
                  />
                  <button onClick={saveNick} className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-xs font-medium flex-shrink-0">
                    Kaydet
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-[8px] text-white">{nick.charAt(0).toUpperCase()}</span>
                  </div>
                  <input
                    type="text"
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Mesaj yaz..."
                    className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    maxLength={200}
                  />
                  <button onClick={sendMessage} disabled={!chatText.trim()} className="p-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-30 rounded-lg flex-shrink-0">
                    <FiSend className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
