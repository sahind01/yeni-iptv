'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiUser, FiLock, FiServer, FiEye, FiEyeOff } from 'react-icons/fi';
import { useStore } from '@/store/useStore';
import { FirebaseService } from '@/services/firebase';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, login: storeLogin, setAuthReady } = useStore();
  
  const [formData, setFormData] = useState({
    site: '',
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.site.trim()) {
      setError('Site adı gerekli');
      return;
    }
    if (!formData.username.trim()) {
      setError('Kullanıcı adı gerekli');
      return;
    }
    if (!formData.password.trim()) {
      setError('Şifre gerekli');
      return;
    }

    setIsLoading(true);

    try {
      const userId = await FirebaseService.loginUser(
        formData.site.trim(),
        formData.username.trim(),
        formData.password.trim()
      );
      
      storeLogin(userId, formData.username.trim(), formData.site.trim());
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          >
            <span className="text-3xl">📺</span>
          </motion.div>
          
          <h1 className="text-3xl font-bold">
            <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Mutlu Player
            </span>
          </h1>
          <p className="text-gray-400 mt-2">Premium IPTV Deneyimi</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="glass-card p-6 space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Site</label>
              <div className="relative">
                <FiServer className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  name="site"
                  value={formData.site}
                  onChange={handleChange}
                  placeholder="Mutlu IPTV"
                  className="input-field pl-10"
                  autoComplete="off"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Kullanıcı Adı</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Kullanıcı adınız"
                  className="input-field pl-10"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Şifre</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center space-x-2 h-12"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Giriş Yap</span>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Örnek: Site: Mutlu IPTV | Kullanıcı: Utay | Şifre: 0158</p>
        </div>
      </motion.div>
    </div>
  );
}
