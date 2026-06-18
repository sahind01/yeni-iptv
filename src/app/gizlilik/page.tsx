import MainLayout from '@/components/Layout/MainLayout';
import { FiLock, FiShield, FiUser, FiDatabase } from 'react-icons/fi';

export default function GizlilikPage() {
  return (
    <MainLayout>
      <div className="p-4 lg:p-8 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiLock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">Gizlilik Politikası</h1>
          <p className="text-gray-400 mt-1">Son güncelleme: 2024</p>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-5">
            <div className="flex items-start space-x-3">
              <FiDatabase className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-sm mb-2">Toplanan Veriler</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Kullanıcı adı, site bilgisi ve favori kanallarınız Firebase veritabanında saklanır. 
                  Yayın URL'leri kesinlikle kaydedilmez. Şifreniz hash'lenerek korunur.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-start space-x-3">
              <FiShield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-sm mb-2">Veri Güvenliği</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Tüm verileriniz Firebase güvenliği altında korunur. 
                  Üçüncü şahıslarla hiçbir veriniz paylaşılmaz. 
                  Yayın akışları şifreli bağlantı üzerinden iletilir.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-start space-x-3">
              <FiUser className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-sm mb-2">Kullanıcı Hakları</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Dilediğiniz zaman hesabınızı silme, verilerinizi görüntüleme ve düzeltme hakkına sahipsiniz. 
                  Admin iletişim kanallarından taleplerinizi iletebilirsiniz.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-start space-x-3">
              <FiLock className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-sm mb-2">Çerezler</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Sadece oturum bilgilerinizi hatırlamak için gerekli çerezler kullanılır. 
                  Reklam veya takip çerezleri kullanılmaz.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-500 text-xs">
            Sorularınız için: <a href="https://t.me/mutluadmin" target="_blank" className="text-blue-400 hover:underline">@mutluadmin</a>
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
