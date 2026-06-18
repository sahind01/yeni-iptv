import MainLayout from '@/components/Layout/MainLayout';
import { FiInfo, FiTv, FiZap, FiShield } from 'react-icons/fi';

export default function HakkimizdaPage() {
  return (
    <MainLayout>
      <div className="p-4 lg:p-8 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiInfo className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">Hakkımızda</h1>
          <p className="text-gray-400 mt-1">Mutlu Player hakkında bilmeniz gerekenler</p>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-3">Mutlu Player Nedir?</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Mutlu Player, kullanıcılarına yüksek kalitede IPTV hizmeti sunan modern bir yayın platformudur. 
              Canlı TV kanalları, filmler ve dizileri tek bir platformda birleştirerek size en iyi izleme deneyimini yaşatmayı hedefler.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-5 text-center">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FiTv className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-medium text-sm mb-1">1000+ Kanal</h3>
              <p className="text-gray-500 text-xs">Geniş kanal arşivi</p>
            </div>

            <div className="glass-card p-5 text-center">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FiZap className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-medium text-sm mb-1">Hızlı Yayın</h3>
              <p className="text-gray-500 text-xs">Buffer sorunu yok</p>
            </div>

            <div className="glass-card p-5 text-center">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FiShield className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="font-medium text-sm mb-1">Güvenli</h3>
              <p className="text-gray-500 text-xs">Şifreli bağlantı</p>
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-3">İletişim</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Telegram Grubu</span>
                <a href="https://t.me/digitaltivi" target="_blank" className="text-blue-400 hover:underline">Telegram Grubu</a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Admin</span>
                <a href="https://t.me/mutflixadmin" target="_blank" className="text-blue-400 hover:underline">mutlu admin</a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Versiyon</span>
                <span className="text-white">1.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
