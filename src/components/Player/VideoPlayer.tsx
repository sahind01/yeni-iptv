'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useStore } from '@/store/useStore';

export default function VideoPlayer({ onBack }: { onBack?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const { currentChannel } = useStore();

  const [state, setState] = useState({
    isPlaying: false,
    isMuted: false,
    volume: 1,
    currentTime: 0,
    duration: 0,
    quality: 'auto',
    error: null as string | null,
    showControls: true,
  });

  // Player başlat
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentChannel?.url) return;

    // Önceki player'ı temizle
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const url = currentChannel.url;

    // HLS mi kontrol et (.m3u8)
    if (url.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 30,
      });

      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
        setState(prev => ({ ...prev, error: null }));
      });

      hls.on(Hls.Events.ERROR, () => {
        // HLS hatası - direkt MP4 olarak dene
        video.src = url;
        video.load();
        video.play().catch(() => {});
      });
    } else {
      // MP4/TS/Diğer formatlar
      video.src = url;
      video.load();
      video.play().catch(() => {
        setState(prev => ({ ...prev, error: 'Yayın açılamadı, tekrar deneniyor...' }));
        setTimeout(() => {
          video.load();
          video.play().catch(() => {});
        }, 2000);
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentChannel?.url]);

  // Video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setState(prev => ({ ...prev, isPlaying: true, error: null }));
    const onPause = () => setState(prev => ({ ...prev, isPlaying: false }));
    const onTimeUpdate = () => setState(prev => ({ ...prev, currentTime: video.currentTime }));
    const onDuration = () => setState(prev => ({ ...prev, duration: video.duration }));
    const onVolume = () => setState(prev => ({ ...prev, volume: video.volume, isMuted: video.muted }));
    const onError = () => setState(prev => ({ ...prev, error: 'Yayın geçici olarak kullanılamıyor' }));
    const onWaiting = () => setState(prev => ({ ...prev, error: 'Yükleniyor...' }));
    const onCanPlay = () => setState(prev => ({ ...prev, error: null }));

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDuration);
    video.addEventListener('volumechange', onVolume);
    video.addEventListener('error', onError);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('canplay', onCanPlay);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDuration);
      video.removeEventListener('volumechange', onVolume);
      video.removeEventListener('error', onError);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('canplay', onCanPlay);
    };
  }, []);

  const togglePlay = () => videoRef.current?.[state.isPlaying ? 'pause' : 'play']();
  const toggleMute = () => { if (videoRef.current) videoRef.current.muted = !state.isMuted; };
  const changeVolume = (v: number) => { if (videoRef.current) videoRef.current.volume = v; };
  const toggleFullscreen = () => document.fullscreenElement ? document.exitFullscreen() : containerRef.current?.requestFullscreen();

  const formatTime = (t: number) => {
    if (!isFinite(t) || t < 0) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!currentChannel) {
    return <div className="flex items-center justify-center h-48 bg-[#111] rounded-xl"><p className="text-gray-500">Kanal seçilmedi</p></div>;
  }

  return (
    <div ref={containerRef} className="relative w-full bg-black overflow-hidden rounded-xl" style={{ aspectRatio: '16/9' }}>
      <video ref={videoRef} className="w-full h-full object-contain" playsInline autoPlay controls={false} />

      {/* Hata */}
      {state.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
          <div className="text-center">
            <p className="text-gray-300 text-sm mb-2">{state.error}</p>
            <button onClick={() => { if(videoRef.current) { videoRef.current.load(); videoRef.current.play().catch(()=>{}); } }} className="px-4 py-1.5 bg-blue-500 rounded-lg text-xs">Tekrar Dene</button>
          </div>
        </div>
      )}

      {/* Üst bar */}
      <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/70 to-transparent z-10" onClick={e => e.stopPropagation()}>
        {onBack && <button onClick={onBack} className="text-sm">← Geri</button>}
        <p className="text-xs font-medium mt-1">{currentChannel.name}</p>
      </div>

      {/* Alt bar */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent z-10" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <button onClick={togglePlay} className="p-1 text-sm">{state.isPlaying ? '⏸' : '▶️'}</button>
          <button onClick={toggleMute} className="p-1 text-sm">{state.isMuted ? '🔇' : '🔊'}</button>
          <span className="text-xs">{formatTime(state.currentTime)} / {formatTime(state.duration)}</span>
          <button onClick={toggleFullscreen} className="p-1 text-sm">⛶</button>
        </div>
      </div>
    </div>
  );
}
