'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiShield, FiSmartphone, FiLock, FiStar, FiSend, FiCheck, FiMessageSquare, FiX, FiTv, FiSearch } from 'react-icons/fi';
import MainLayout from '@/components/Layout/MainLayout';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';

interface TVProgramme {
  channel: string;
  title: string;
  start: string;
  stop: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { username } = useStore();
  const [greeting, setGreeting] = useState('');
  const [showMatches, setShowMatches] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showTV, setShowTV] = useState(false);
  const [tvProgrammes, setTvProgrammes] = useState<TVProgramme[]>([]);
  const [tvLoading, setTvLoading] = useState(false);
  const [tvSearch, setTvSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'istek' | 'sikayet'>('istek');
  const [formNick, setFormNick] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formSending, setFormSending] = useState(false);
  const [formSent, setFormSent] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 6) setGreeting('İyi Geceler');
    else if (hour < 12) setGreeting('Günaydın');
    else if (hour < 18) setGreeting('İyi Günler');
    else setGreeting('İyi Akşamlar');
  }, []);

  const fetchTVProgrammes = async (search = '') => {
    setTvLoading(true);
    try {
      const url = search ? `/api/epg?search=${encodeURIComponent(search)}` : '/api/epg';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTvProgrammes(data.onAir);
      }
    } catch (err) { console.error(err); }
    finally { setTvLoading(false); }
  };

  const handleTVClick = () => {
    setShowTV(!showTV);
    if (!showTV && tvProgrammes.length === 0) fetchTVProgrammes();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTVProgrammes(tvSearch);
  };

  const sendToTelegram = async () => {
    if (!formMessage.trim()) { setFormError('Lütfen bir mesaj yazın'); return; }
    setFormSending(true); setFormError('');
    const botToken = '8435669727:AAGoKJa1kwcS4RYExyGyZbTMUCGnVzy95kM';
    const chatId = '-1004409413329';
    const emoji = formType === 'istek' ? '💡' : '⚠️';
    const typeLabel = formType === 'istek' ? 'İSTEK' : 'ŞİKAYET';
    const nick = formNick.trim() || 'Anonim';
    const text = `${emoji} *YENİ ${typeLabel}*\n\n👤 *Kullanıcı:* ${nick}\n📝 *Mesaj:* ${formMessage}\n⏰ *Tarih:* ${new Date().toLocaleString('tr-TR')}`;
    try {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
      });
      setFormSent(true);
      setTimeout(() => { setShowForm(false); setFormSent(false); setFormMessage(''); setFormNick(''); setFormType('istek'); }, 2000);
    } catch (err) { setFormError('Gönderilemedi'); }
    finally { setFormSending(false); }
  };

  const formatTime = (timeStr: string) => {
    try {
      const year = timeStr.substring(0, 4);
      const month = timeStr.substring(4, 6);
      const day = timeStr.substring(6, 8);
      const hour = timeStr.substring(8, 10);
      const min = timeStr.substring(10, 12);
      return `${hour}:${min}`;
    } catch { return timeStr; }
  };

  return (
    <MainLayout>
      <div className="p-4 lg:p-8 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <h1 className="text-2xl font-bold text-white">
            {greeting}, <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">{username || 'Kullanıcı'}</span> 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">Bugün ne izlemek istersin?</p>
        </motion.div>

        {/* GÜNÜN MAÇLARI */}
        <div className="mb-3">
          {!showMatches ? (
            <button onClick={() => setShowMatches(true)}
              className="w-full p-4 rounded-xl border border-gray-700 bg-[#1a1a1a] hover:bg-[#222] cursor-pointer transition-all flex items-center justify-between">
              <div className="flex items-center gap-3"><span className="text-2xl">⚽</span><div className="text-left"><h3 className="text-sm font-semibold text-white">Günün Maçları</h3><p className="text-[10px] text-gray-400 mt-0.5">Bugünün maç programını görüntüle</p></div></div>
              <span className="text-[9px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">CANLI</span>
            </button>
          ) : (
            <div className="rounded-xl border border-gray-700 overflow-hidden bg-[#111]">
              <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-gray-700"><div className="flex items-center gap-2"><span className="text-base">⚽</span><h2 className="text-xs font-semibold text-white">Günün Maçları</h2></div><button onClick={() => setShowMatches(false)} className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"><FiX className="w-4 h-4" /></button></div>
              <div className="h-[400px] sm:h-[500px]"><iframe src="https://mutlugunmaci.vercel.app/" className="w-full h-full" style={{ border: 'none' }} title="Günün Maçları" /></div>
            </div>
          )}
        </div>

        {/* TV'DE NE VAR */}
        <div className="mb-3">
          <button onClick={handleTVClick}
            className="w-full p-4 rounded-xl border border-gray-700 bg-[#1a1a1a] hover:bg-[#222] cursor-pointer transition-all flex items-center justify-between">
            <div className="flex items-center gap-3"><span className="text-2xl">📺</span><div className="text-left"><h3 className="text-sm font-semibold text-white">TV'de Ne Var?</h3><p className="text-[10px] text-gray-400 mt-0.5">Şu an tüm kanallarda neler var?</p></div></div>
            <FiTv className="w-5 h-5 text-gray-500" />
          </button>
          {showTV && (
            <div className="mt-2 p-4 rounded-xl border border-gray-700 bg-[#1a1a1a]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">📺 Şu An Yayında</h3>
                <button onClick={() => { setShowTV(false); setTvSearch(''); }} className="text-gray-500 hover:text-white"><FiX className="w-4 h-4" /></button>
              </div>

              {/* ARAMA */}
              <form onSubmit={handleSearch} className="relative mb-3">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5" />
                <input type="text" value={tvSearch} onChange={(e) => setTvSearch(e.target.value)}
                  placeholder="Kanal veya program ara..."
                  className="w-full bg-[#111] border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
              </form>

              {tvLoading ? (
                <div className="flex justify-center py-6"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>
              ) : tvProgrammes.length === 0 ? (
                <p className="text-gray-500 text-xs text-center py-4">Veri alınamadı</p>
              ) : (
                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                  <p className="text-[10px] text-gray-500 mb-2">{tvProgrammes.length} program bulundu</p>
                  {tvProgrammes.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-white/5 rounded-lg">
                      <div className="flex-1 min-w-0"><p className="text-xs text-white font-medium truncate">{p.title}</p><p className="text-[10px] text-gray-500">{p.channel}</p></div>
                      <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{formatTime(p.start)} - {formatTime(p.stop)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* MAÇ İSTATİSTİKLERİ */}
        <div className="mb-3">
          {!showStats ? (
            <button onClick={() => setShowStats(true)}
              className="w-full p-4 rounded-xl border border-gray-700 bg-[#1a1a1a] hover:bg-[#222] cursor-pointer transition-all flex items-center justify-between">
              <div className="flex items-center gap-3"><span className="text-2xl">📊</span><div className="text-left"><h3 className="text-sm font-semibold text-white">Maç İstatistikleri</h3><p className="text-[10px] text-gray-400 mt-0.5">Canlı maç istatistiklerini görüntüle</p></div></div>
              <span className="text-[9px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">İSTAT</span>
            </button>
          ) : (
            <div className="rounded-xl border border-gray-700 overflow-hidden bg-[#111]">
              <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-gray-700"><div className="flex items-center gap-2"><span className="text-base">📊</span><h2 className="text-xs font-semibold text-white">Maç İstatistikleri</h2></div><button onClick={() => setShowStats(false)} className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"><FiX className="w-4 h-4" /></button></div>
              <div className="h-[400px] sm:h-[500px]"><iframe src="https://macistatik.vercel.app/" className="w-full h-full" style={{ border: 'none' }} title="Maç İstatistikleri" /></div>
            </div>
          )}
        </div>

        {/* İSTEK & ŞİKAYET */}
        <div className="mb-3">
          {!showForm ? (
            <button onClick={() => setShowForm(true)}
              className="w-full p-4 rounded-xl border border-gray-700 bg-[#1a1a1a] hover:bg-[#222] cursor-pointer transition-all flex items-center justify-between">
              <div className="flex items-center gap-3"><span className="text-2xl">📩</span><div className="text-left"><h3 className="text-sm font-semibold text-white">İstek / Şikayet</h3><p className="text-[10px] text-gray-400 mt-0.5">Talep veya şikayetinizi bize iletin</p></div></div>
              <FiMessageSquare className="w-5 h-5 text-gray-500" />
            </button>
          ) : (
            <div className="p-5 rounded-xl border border-gray-700 bg-[#1a1a1a]">
              <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold text-white">📩 İstek / Şikayet</h3><button onClick={() => { setShowForm(false); setFormError(''); }} className="text-gray-500 hover:text-white text-lg">✕</button></div>
              {formSent ? (
                <div className="text-center py-6"><FiCheck className="w-10 h-10 text-green-400 mx-auto mb-2" /><p className="text-sm text-green-400 font-medium">Gönderildi!</p></div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button onClick={() => setFormType('istek')} className={`flex-1 py-2.5 rounded-lg text-xs font-medium ${formType === 'istek' ? 'bg-blue-500/20 border border-blue-500 text-blue-400' : 'bg-white/5 border border-gray-700 text-gray-400'}`}>💡 İstek</button>
                    <button onClick={() => setFormType('sikayet')} className={`flex-1 py-2.5 rounded-lg text-xs font-medium ${formType === 'sikayet' ? 'bg-red-500/20 border border-red-500 text-red-400' : 'bg-white/5 border border-gray-700 text-gray-400'}`}>⚠️ Şikayet</button>
                  </div>
                  <div><label className="text-[10px] text-gray-400 mb-1 block">Nick</label><input type="text" value={formNick} onChange={(e) => setFormNick(e.target.value)} placeholder="Anonim" className="w-full bg-[#111] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" maxLength={30} /></div>
                  <div><label className="text-[10px] text-gray-400 mb-1 block">{formType === 'istek' ? 'İstek' : 'Şikayet'}</label><textarea value={formMessage} onChange={(e) => setFormMessage(e.target.value)} placeholder="Detaylı yazın..." className="w-full bg-[#111] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 h-24 resize-none" maxLength={500} /></div>
                  {formError && <p className="text-red-400 text-[10px]">{formError}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => { setShowForm(false); setFormError(''); }} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs">İptal</button>
                    <button onClick={sendToTelegram} disabled={formSending} className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-lg text-xs font-medium flex items-center justify-center gap-2">
                      {formSending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FiSend className="w-3 h-3" /> Gönder</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div onClick={() => window.open('https://t.me/mutluadmin', '_blank')} className="p-3 rounded-xl border border-gray-700 bg-[#1a1a1a] hover:bg-[#222] cursor-pointer transition-all"><div className="flex items-center gap-2"><FiLock className="w-4 h-4 text-blue-400" /><p className="text-xs text-white font-medium">Şifre Değiştir</p></div><p className="text-[10px] text-gray-500 mt-1">Admin ile iletişime geçin</p></div>
          <div onClick={() => router.push('/nasil-kullanilir')} className="p-3 rounded-xl border border-gray-700 bg-[#1a1a1a] hover:bg-[#222] cursor-pointer transition-all"><div className="flex items-center gap-2"><FiSmartphone className="w-4 h-4 text-green-400" /><p className="text-xs text-white font-medium">Mobil Uygulama</p></div><p className="text-[10px] text-gray-500 mt-1">Ana ekrana ekleyin</p></div>
          <div onClick={() => router.push('/settings')} className="p-3 rounded-xl border border-gray-700 bg-[#1a1a1a] hover:bg-[#222] cursor-pointer transition-all"><div className="flex items-center gap-2"><FiStar className="w-4 h-4 text-yellow-400" /><p className="text-xs text-white font-medium">Ayarlar</p></div><p className="text-[10px] text-gray-500 mt-1">Tema ve dil ayarları</p></div>
        </div>

        <div className="p-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5"><div className="flex items-start space-x-3"><FiShield className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" /><div><p className="text-[11px] text-yellow-400 font-medium mb-0.5">Güvenlik Uyarısı</p><p className="text-[10px] text-gray-400">Bu hesap size özeldir. Hesap bilgilerinizi başkalarıyla paylaşmanız durumunda hesabınız askıya alınabilir.</p></div></div></div>
      </div>
    </MainLayout>
  );
}
