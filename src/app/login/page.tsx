'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiUser, FiLock, FiServer, FiEye, FiEyeOff } from 'react-icons/fi';
import { useStore } from '@/store/useStore';
import { FirebaseService } from '@/services/firebase';
import { M3UParser } from '@/services/m3u-parser';
import { ref, get } from 'firebase/database';
import { db } from '@/services/firebase';

export default function LoginPage() {
  const router = useRouter();
  const { 
    isAuthenticated, isAuthReady,
    login: storeLogin, setChannels, setAuthReady,
  } = useStore();
  
  const [formData, setFormData] = useState({ site: '', username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    if (isAuthReady && isAuthenticated) router.push('/dashboard');
  }, [isAuthReady, isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDebugInfo('');
    
    if (!formData.username.trim()) { setError('Kullanıcı adı gerekli'); return; }
    if (!formData.password.trim()) { setError('Şifre gerekli'); return; }

    setIsLoading(true);

    try {
      const username = formData.username.trim();
      const password = formData.password.trim();
      const site = formData.site.trim() || 'IPTV';

      setDebugInfo('M3U kontrol ediliyor...');
      const apiUrl = `https://mutlu-iptv.vercel.app/api/m3u?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Kullanıcı adı veya şifre hatalı (M3U)');

      setDebugInfo('Firebase kontrol ediliyor... UserId: ' + username);
      
      // DİREKT FIREBASE'DEN OKU
      const userRef = ref(db, `users/${username}`);
      const snapshot = await get(userRef);
      
      setDebugInfo('Firebase yanıt: ' + (snapshot.exists() ? 'KULLANICI BULUNDU' : 'KULLANICI YOK'));
      
      if (!snapshot.exists()) {
        // Bir de tüm users'ları listeleyelim
        const allUsersRef = ref(db, 'users');
        const allSnap = await get(allUsersRef);
        if (allSnap.exists()) {
          const keys = Object.keys(allSnap.val());
          setDebugInfo('Firebase\'deki kullanıcılar: ' + keys.join(', ') + ' | Aranan: ' + username);
        } else {
          setDebugInfo('Firebase\'de hiç kullanıcı yok!');
        }
        throw new Error('Kullanıcı bulunamadı');
      }

      const userData = snapshot.val();
      setDebugInfo('Şifre kontrolü...');

      if (userData.password !== password) {
        throw new Error('Hatalı şifre');
      }

      if (userData.expireDate) {
        const expire = new Date(userData.expireDate).getTime();
        if (Date.now() > expire) {
          throw new Error('Süreniz dolmuştur');
        }
      }

      setDebugInfo('Giriş başarılı!');

      const m3uContent = await response.text();
      const parser = M3UParser.getInstance();
      const channels = parser.parse(m3uContent);

      storeLogin(username, username, site, password);
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
              <label className="block text-sm text-gray-400 mb-1.5">Site</label>
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
            
            {debugInfo && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-blue-400 text-xs whitespace-pre-wrap">{debugInfo}</div>
            )}
            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">{error}</div>}
            
            <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center space-x-2 h-12">
              {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>Giriş Yap</span>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
