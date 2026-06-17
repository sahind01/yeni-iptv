'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { useStore } from '@/store/useStore';
import { FirebaseService } from '@/services/firebase';
import type { UserSettings } from '@/types';
import { QUALITY_OPTIONS } from '@/utils/constants';
import { FiMoon, FiSun, FiPlay, FiGlobe, FiLock, FiChevronRight } from 'react-icons/fi';
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

  useEffect(() => {
    if (userId) {
      loadSettings();
    }
  }, [userId]);

  const loadSettings = async () => {
    if (!userId) return;
    const userData = await FirebaseService.getUserData(userId);
    if (userData?.settings) {
      setSettings(userData.settings as UserSettings);
    }
  };

  const handleSave = async (key: keyof UserSettings, value: any) => {
    if (!userId) return;

    setIsSaving(true);
    const newSettings: UserSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      await FirebaseService.updateUserSettings(userId, newSettings);
      toast.success('Ayar kaydedildi');
    } catch (err) {
      toast.error('Ayar kaydedilemedi');
      setSettings(settings);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePinSuccess = () => {
    setShowPinModal(false);
    toast.success('PIN başarıyla değiştirildi');
  };

  return (
    <MainLayout>
      <div className="p-4 lg:p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Ayarlar</h1>

        {/* Kullanıcı Bilgisi */}
        <div className="glass-card p-4 mb-6">
          <h3 className="text-sm text-gray-400 mb-2">Hesap Bilgileri</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Kullanıcı Adı</span>
              <span className="text-sm text-gray-400">{username}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Site</span>
              <span className="text-sm text-gray-400">{site}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Tema */}
          <div className="glass-card p-4">
            <h3 className="text-sm text-gray-400 mb-3">Tema</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => handleSave('theme', 'dark')}
                className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-xl transition-all ${
                  settings.theme === 'dark'
                    ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                    : 'bg-white/5 border border-transparent hover:bg-white/10'
                }`}
              >
                <FiMoon className="w-4 h-4" />
                <span className="text-sm">Karanlık</span>
              </button>
              <button
                onClick={() => handleSave('theme', 'light')}
                className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-xl transition-all ${
                  settings.theme === 'light'
                    ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                    : 'bg-white/5 border border-transparent hover:bg-white/10'
                }`}
              >
                <FiSun className="w-4 h-4" />
                <span className="text-sm">Aydınlık</span>
              </button>
            </div>
          </div>

          {/* Otomatik Oynatma */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FiPlay className="w-5 h-5 text-gray-400" />
                <div>
                  <h3 className="text-sm font-medium">Otomatik Oynatma</h3>
                  <p className="text-xs text-gray-500">Kanal seçildiğinde otomatik başlat</p>
                </div>
              </div>
              <button
                onClick={() => handleSave('autoPlay', !settings.autoPlay)}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  settings.autoPlay ? 'bg-blue-500' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${
                    settings.autoPlay ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Kalite Tercihi */}
          <div className="glass-card p-4">
            <h3 className="text-sm text-gray-400 mb-3">Varsayılan Kalite</h3>
            <div className="grid grid-cols-2 gap-2">
              {QUALITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSave('preferredQuality', option.value as UserSettings['preferredQuality'])}
                  className={`p-3 rounded-xl text-sm transition-all ${
                    settings.preferredQuality === option.value
                      ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                      : 'bg-white/5 border border-transparent hover:bg-white/10'
                  }`}
                >
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
                <div>
                  <h3 className="text-sm font-medium">Dil</h3>
                  <p className="text-xs text-gray-500">Arayüz dili</p>
                </div>
              </div>
              <select
                value={settings.language}
                onChange={(e) => handleSave('language', e.target.value as UserSettings['language'])}
                className="bg-white/5 border border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
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
                <div>
                  <h3 className="text-sm font-medium">Adult PIN</h3>
                  <p className="text-xs text-gray-500">PIN kodunu değiştir</p>
                </div>
              </div>
              <button
                onClick={() => setShowPinModal(true)}
                className="flex items-center space-x-1 text-sm text-blue-400 hover:text-blue-300"
              >
                <span>Değiştir</span>
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Uygulama Bilgisi */}
          <div className="glass-card p-4">
            <h3 className="text-sm text-gray-400 mb-2">Uygulama Bilgisi</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Versiyon</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Platform</span>
                <span>Next.js 15</span>
              </div>
            </div>
          </div>
        </div>

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
