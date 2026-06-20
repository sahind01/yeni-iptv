'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiZap, FiShield, FiMaximize2, FiMinimize2, FiAlertCircle, FiSmartphone, FiLock, FiGift, FiStar, FiSend, FiMessageSquare, FiAlertTriangle, FiCheck } from 'react-icons/fi';
import MainLayout from '@/components/Layout/MainLayout';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const { username } = useStore();
  const [greeting, setGreeting] = useState('');
  const [iframeFull, setIframeFull] = useState(false);

  // İstek/Şikayet
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

  // Telegram'a mesaj gönder
  const sendToTelegram = async () => {
    if (!formMessage.trim()) {
      setFormError('Lütfen bir mesaj yazın');
      return;
    }
    if (!formNick.trim()) {
      setFormNick('Anonim');
    }

    setFormSending(true);
    setFormError('');

    const botToken = '8435669727:AAGoKJa1kwcS4RYExyGyZbTMUCGnVzy95kM';
    const chatId = '-1004409413329';
    
    const emoji = formType === 'istek' ? '💡' : '⚠️';
    const typeLabel = formType === 'istek' ? 'İSTEK' : 'ŞİKAYET';
    
    const text = `${emoji} *YENİ ${typeLabel}*\n\n` +
      `👤 *Kullanıcı:* ${formNick}\n` +
      `📝 *Mesaj:* ${formMessage}\n` +
      `⏰ *Tarih:* ${new Date().toLocaleString('tr-TR')}`;

    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'Markdown',
        }),
      });

      if (!res.ok) throw new Error('Gönderilemedi');
      
      setFormSent(true);
      setTimeout(() => {
        setShowForm(false);
        setFormSent(false);
        setFormMessage('');
        setFormNick('');
        setFormType('istek');
      }, 2000);
    } catch (err) {
      setFormError('Gönderilemedi, lütfen tekrar deneyin');
    } finally {
      setFormSending(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-4 lg:p-8 max-w-5xl mx-auto">
        {/* Hoş Geldin */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-white">
            {greeting}, <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">{username || 'Kullanıcı'}</span> 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">Bugün ne izlemek istersin?</p>
        </motion.div>

        {/* GÜNÜN MAÇLARI */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚽</span>
              <h2 className="text-sm font-semibold text-white">Günün Maçları</h2>
              <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">CANLI</span>
            </div>
            <button onClick={() => setIframeFull(!iframeFull)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all">
              {iframeFull ? <FiMinimize2 className="w-4 h-4" /> : <FiMaximize2 className="w-4 h-4" />}
            </button>
          </div>
          <div className={`rounded-xl border border-gray-700 overflow-hidden bg-[#111] transition-all duration-300 ${iframeFull ? 'h-[500px] sm:h-[600px]' : 'h-[300px] sm:h-[350px]'}`}>
            <iframe src="https://mutlugunmaci.vercel.app/" className="w-full h-full" style={{ border: 'none' }} title="Günün Maçları" sandbox="allow-scripts allow-same-origin" loading="lazy" />
          </div>
        </motion.div>

        {/* İSTEK & ŞİKAYET */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          {!showForm ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button onClick={() => { setShowForm(true); setFormType('istek'); }}
                className="p-5 rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 cursor-pointer transition-all text-left">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">💡</span>
                  <div>
                    <h3 className="text-sm font-semibold text-white">İstek Talebi</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">Kanal, film veya dizi isteğinde bulun</p>
                  </div>
                </div>
              </button>

              <button onClick={() => { setShowForm(true); setFormType('sikayet'); }}
                className="p-5 rounded-xl border border-red-500/30 bg-gradient-to-br from-red-500/10 to-orange-500/10 hover:from-red-500/20 hover:to-orange-500/20 cursor-pointer transition-all text-left">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">⚠️</span>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Şikayet Bildir</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">Sorun veya şikayetinizi iletin</p>
                  </div>
                </div>
              </button>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="p-5 rounded-xl border border-gray-700 bg-[#1a1a1a]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  {formType === 'istek' ? '💡 İstek Talebi' : '⚠️ Şikayet Bildirimi'}
                </h3>
                <button onClick={() => { setShowForm(false); setFormError(''); }} className="text-gray-500 hover:text-white">✕</button>
              </div>

              {formSent ? (
                <div className="text-center py-6">
                  <FiCheck className="w-10 h-10 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-green-400 font-medium">Gönderildi!</p>
                  <p className="text-[11px] text-gray-400 mt-1">Teşekkürler, en kısa sürede dönüş yapılacaktır.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-gray-400 mb-1 block">Nick (Opsiyonel)</label>
                    <input type="text" value={formNick} onChange={(e) => setFormNick(e.target.value)}
                      placeholder="Anonim olarak gönder"
                      className="w-full bg-[#111] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      maxLength={30} />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 mb-1 block">
                      {formType === 'istek' ? 'İstek Detayı' : 'Şikayet Detayı'}
                    </label>
                    <textarea value={formMessage} onChange={(e) => setFormMessage(e.target.value)}
                      placeholder={formType === 'istek' ? 'Hangi kanal/film/dizi eklenmesini istersiniz?' : 'Sorununuzu detaylıca açıklayın...'}
                      className="w-full bg-[#111] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 h-24 resize-none"
                      maxLength={500} />
                  </div>
                  
                  {formError && <p className="text-red-400 text-[10px]">{formError}</p>}

                  <div className="flex gap-2">
                    <button onClick={() => { setShowForm(false); setFormError(''); }}
                      className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs transition-all">İptal</button>
                    <button onClick={sendToTelegram} disabled={formSending}
                      className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all">
                      {formSending ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <><FiSend className="w-3 h-3" /> Gönder</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* ALT BİLGİ KARTLARI */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div onClick={() => window.open('https://t.me/mutluadmin', '_blank')}
            className="p-3 rounded-xl border border-gray-700 bg-[#1a1a1a] hover:bg-[#222] cursor-pointer transition-all">
            <div className="flex items-center gap-2"><FiLock className="w-4 h-4 text-blue-400" /><p className="text-xs text-white font-medium">Şifre Değiştir</p></div>
            <p className="text-[10px] text-gray-500 mt-1">Admin ile iletişime geçerek şifrenizi değiştirin</p>
          </div>
          <div onClick={() => router.push('/nasil-kullanilir')}
            className="p-3 rounded-xl border border-gray-700 bg-[#1a1a1a] hover:bg-[#222] cursor-pointer transition-all">
            <div className="flex items-center gap-2"><FiSmartphone className="w-4 h-4 text-green-400" /><p className="text-xs text-white font-medium">Mobil Uygulama</p></div>
            <p className="text-[10px] text-gray-500 mt-1">Ana ekrana ekleyerek uygulama gibi kullanın</p>
          </div>
          <div onClick={() => router.push('/settings')}
            className="p-3 rounded-xl border border-gray-700 bg-[#1a1a1a] hover:bg-[#222] cursor-pointer transition-all">
            <div className="flex items-center gap-2"><FiStar className="w-4 h-4 text-yellow-400" /><p className="text-xs text-white font-medium">Ayarlar</p></div>
            <p className="text-[10px] text-gray-500 mt-1">Tema, dil ve diğer ayarları düzenleyin</p>
          </div>
        </div>

        {/* Güvenlik Uyarısı */}
        <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-start space-x-3">
            <FiShield className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-yellow-400 font-medium mb-1">Güvenlik Uyarısı</p>
              <p className="text-[10px] text-gray-400">Bu hesap size özeldir. Hesap bilgilerinizi başkalarıyla paylaşmanız durumunda hesabınız askıya alınabilir veya kalıcı olarak kapatılabilir.</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
