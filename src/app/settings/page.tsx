'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { useStore } from '@/store/useStore';
import { FirebaseService } from '@/services/firebase';
import type { UserSettings } from '@/types';
import { QUALITY_OPTIONS } from '@/utils/constants';
import { FiMoon, FiSun, FiPlay, FiGlobe, FiLock, FiChevronRight, FiDownload, FiSmartphone } from 'react-icons/fi';
import PinModal from '@/components/UI/PinModal';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { userId, username, site } = useStore();
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'dark',
    autoPlay: true,
    preferredQuality: 'auto',
    language: 'tr',
    bufferSize: 30,
  });
  const [showPinModal, setShowPinModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    if (userId) {
      loadSettings();
      applyTheme();
    }
    
    const ios = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    setIsIOS(ios);

    // PWA kurulabilir mi kontrol et
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    
    if (!standalone) {
      // beforeinstallprompt event'ini dinle
      const handler = (e: Event) => {
        e.preventDefault();
        setCanInstall(true);
        // Event'i sakla
        (window as any).__pwaInstallEvent = e;
      };
      window.addEventListener('beforeinstallprompt', handler);
      
      // iOS'ta her zaman göster
      if (ios) setCanInstall(true);
      
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, [userId]);

  const loadSettings = async () => {
    if (!userId) return;
    const userData = await FirebaseService.getUserData(userId);
    if (userData?.settings) {
      const s = userData.settings as UserSettings;
      setSettings(s);
      applyThemeDirect(s.theme);
    }
  };

  const applyTheme = () => {
    const savedTheme = localStorage.getItem('mutlu_theme') as 'dark' | 'light' | null;
    if (savedTheme) applyThemeDirect(savedTheme);
  };

  const applyThemeDirect = (theme: 'dark' | 'light') => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  };

  const handleSave = async (key: keyof UserSettings, value: any) => {
    if (!userId) return;
    setIsSaving(true);
    const newSettings: UserSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    if (key === 'theme') {
      applyThemeDirect(value);
      localStorage.setItem('mutlu_theme', value);
    }
    try {
      await FirebaseService.updateUserSettings(userId, newSettings);
      toast.success('Ayar kaydedildi');
    } catch (err) {
      toast.error('Ayar kaydedilemedi');
      setSettings(settings);
      if (key === 'theme') {
        applyThemeDirect(settings.theme);
        localStorage.setItem('mutlu_theme', settings.theme);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handlePinSuccess = () => {
    setShowPinModal(false);
    toast.success('PIN başarıyla değiştirildi');
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    const installEvent = (window as any).__pwaInstallEvent;
    
    if (installEvent) {
      try {
        await installEvent.prompt();
        const result = await installEvent.userChoice;
        if (result.outcome === 'accepted') {
          toast.success('✅ Uygulama yükleniyor...');
          setCanInstall(false);
        }
      } catch (err) {
        console.log('Kurulum iptal edildi');
      }
    } else {
      // Manuel kurulum talimatı
      toast('Tarayıcı menüsünden "Ana Ekrana Ekle" seçeneğini kullanın', { icon: '📱' });
    }
  };

  return (
    <MainLayout>
      <div className="p-4 lg:p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-white">Ayarlar</h1>

        {/* Uygulamayı Yükle */}
        {canInstall && (
          <div className="glass-card p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <FiDownload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">Uygulamayı Yükle</h3>
                  <p className="text-xs text-gray-500">Ana ekrana ekleyerek hızlı erişim sağlayın</p>
                </div>
              </div>
              <button onClick={handleInstall}
                className="flex items-center space-x-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl text-xs font-medium transition-all">
                <FiDownload className="w-3.5 h-3.5" />
                <span>Yükle</span>
              </button>
            </div>
          </div>
        )}

        {/* iOS Rehberi */}
        {showIOSGuide && (
          <div className="glass-card p-4 mb-4 border border-blue-500/30">
            <div className="flex items-start space-x-3">
              <FiSmartphone className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white mb-2">iOS Kurulum Adımları</h3>
                <ol className="text-xs text-gray-400 space-y-1.5">
                  <li>1. Safari'de paylaş butonuna <span className="text-blue-400">📤</span> tıklayın</li>
                  <li>2. "<span className="text-white">Ana Ekrana Ekle</span>" seçeneğine tıklayın</li>
                  <li>3. Açılan pencerede "<span className="text-white">Ekle</span>" ye tıklayın</li>
                </ol>
                <button onClick={() => setShowIOSGuide(false)} className="mt-3 text-xs text-blue-400 hover:text-blue-300">
                  Anladım, kapat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Kullanıcı Bilgisi */}
        <div className="glass-card p-4 mb-6">
          <h3 className="text-sm text-gray-400 mb-2">Hesap Bilgileri</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white">Kullanıcı Adı</span>
              <span className="text-sm text-gray-400">{username}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white">Site</span>
              <span className="text-sm text-gray-400">{site}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Tema */}
          <div className="glass-card p-4">
            <h3 className="text-sm text-gray-400 mb-3">Tema</h3>
            <div className="flex space-x-2">
              <button onClick={() => handleSave('theme', 'dark')}
                className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-xl transition-all ${settings.theme === 'dark' ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' : 'bg-white/5 border border-transparent hover:bg-white/10'}`}>
                <FiMoon className="w-4 h-4" /><span className="text-sm">Karanlık</span>
              </button>
              <button onClick={() => handleSave('theme', 'light')}
                className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-xl transition-all ${settings.theme === 'light' ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' : 'bg-white/5 border border-transparent hover:bg-white/10'}`}>
                <FiSun className="w-4 h-4" /><span className="text-sm">Aydınlık</span>
              </button>
            </div>
          </div>

          {/* Otomatik Oynatma */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FiPlay className="w-5 h-5 text-gray-400" />
                <div><h3 className="text-sm font-medium text-white">Otomatik Oynatma</h3><p className="text-xs text-gray-500">Kanal seçildiğinde otomatik başlat</p></div>
              </div>
              <button onClick={() => handleSave('autoPlay', !settings.autoPlay)}
                className={`w-12 h-7 rounded-full transition-colors relative ${settings.autoPlay ? 'bg-blue-500' : 'bg-gray-600'}`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${settings.autoPlay ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* Kalite */}
          <div className="glass-card p-4">
            <h3 className="text-sm text-gray-400 mb-3">Varsayılan Kalite</h3>
            <div className="grid grid-cols-2 gap-2">
              {QUALITY_OPTIONS.map((option) => (
                <button key={option.value} onClick={() => handleSave('preferredQuality', option.value as UserSettings['preferredQuality'])}
                  className={`p-3 rounded-xl text-sm transition-all ${settings.preferredQuality === option.value ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' : 'bg-white/5 border border-transparent hover:bg-white/10'}`}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dil */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FiGlobe className="w-5 h-5 text-gray-400" />
                <div><h3 className="text-sm font-medium text-white">Dil</h3><p className="text-xs text-gray-500">Arayüz dili</p></div>
              </div>
              <select value={settings.language} onChange={(e) => handleSave('language', e.target.value as UserSettings['language'])}
                className="bg-white/5 border border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white">
                <option value="tr">🇹🇷 Türkçe</option>
                <option value="en">🇬🇧 English</option>
              </select>
            </div>
          </div>

          {/* Adult PIN */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FiLock className="w-5 h-5 text-gray-400" />
                <div><h3 className="text-sm font-medium text-white">Adult PIN</h3><p className="text-xs text-gray-500">PIN kodunu değiştir</p></div>
              </div>
              <button onClick={() => setShowPinModal(true)}
                className="flex items-center space-x-1 text-sm text-blue-400 hover:text-blue-300">
                <span>Değiştir</span><FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Uygulama Bilgisi */}
          <div className="glass-card p-4">
            <h3 className="text-sm text-gray-400 mb-2">Uygulama Bilgisi</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Versiyon</span><span className="text-white">1.0.0</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Platform</span><span className="text-white">Next.js 15</span></div>
            </div>
          </div>
        </div>

        <PinModal isOpen={showPinModal} onSuccess={handlePinSuccess} onClose={() => setShowPinModal(false)} />
      </div>
    </MainLayout>
  );
}
