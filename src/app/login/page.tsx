'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiUser, FiLock, FiServer, FiEye, FiEyeOff } from 'react-icons/fi';
import { useStore } from '@/store/useStore';
import { FirebaseService } from '@/services/firebase';
import { M3UParser } from '@/services/m3u-parser';

export default function LoginPage() {
  const router = useRouter();
  const { 
    isAuthenticated, isAuthReady,
    login: storeLogin, setChannels, setAuthReady,
    username: savedUser, site: savedSite, password: savedPass,
  } = useStore();
  
  const [formData, setFormData] = useState({
    site: savedSite || '',
    username: savedUser || '',
    password: savedPass || '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthReady && isAuthenticated) router.push('/dashboard');
  }, [isAuthReady, isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.site.trim()) { setError('Site adı gerekli'); return; }
    if (!formData.username.trim()) { setError('Kullanıcı adı gerekli'); return; }
    if (!formData.password.trim()) { setError('Şifre gerekli'); return; }

    setIsLoading(true);

    try {
      const username = formData.username.trim();
      const password = formData.password.trim();
      const site = formData.site.trim();

      const apiUrl = `https://mutlu-iptv.vercel.app/api/m3u?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Kullanıcı adı veya şifre hatalı');

      const cleanSite = site.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const cleanUser = username.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const userId = `${cleanSite}_${cleanUser}`;

      const deviceCount = await FirebaseService.getActiveDeviceCount(userId);

      if (deviceCount >= 1) {
        window.location.href = 'https://mutlu-iptv.vercel.app';
        return;
      }

      const deviceId = await FirebaseService.addActiveDevice(userId);
      localStorage.setItem('mutlu_device_id', deviceId);
      localStorage.setItem('mutlu_user_id', userId);

      const m3uContent = await response.text();
      const parser = M3UParser.getInstance();
      const channels = parser.parse(m3uContent);

      await FirebaseService.loginUser(site, username, password);

      storeLogin(userId, username, site, password);
      setChannels(channels);
      setAuthReady(true);
      router.push('/dashboard');

    } catch (err: any) {
      setError(err.message || 'Giriş başarısız');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl">📺</span>
          </div>
          <h1 className="text-3xl font-bold">
            <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">Mutlu Player</span>
          </h1>
          <p className="text-gray-400 mt-2">Premium IPTV Deneyimi</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="glass-card p-6 space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Site Adı</label>
              <div className="relative">
                <FiServer className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="text" name="site" value={formData.site} onChange={handleChange} placeholder="Mutlu IPTV" className="input-field pl-10" autoComplete="off" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Kullanıcı Adı</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Kullanıcı adınız" className="input-field pl-10" autoComplete="username" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Şifre</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className="input-field pl-10 pr-10" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">{error}</div>}
            <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center space-x-2 h-12">
              {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>Giriş Yap</span>}
            </button>
          </div>
        </form>
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Tek cihaz desteği</p>
        </div>
      </motion.div>
    </div>
  );
}
