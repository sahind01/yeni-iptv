import MainLayout from '@/components/Layout/MainLayout';
import { FiHelpCircle, FiLink, FiPlay, FiSmartphone, FiTv, FiWifi, FiAlertCircle, FiCheck, FiX } from 'react-icons/fi';

const faqData = [
  {
    question: 'Mutlu Player nedir?',
    answer: 'Mutlu Player, Mutlu IPTV hizmetine özel geliştirilmiş bir online TV izleme platformudur. Canlı TV kanallarını, filmleri ve dizileri tek bir yerden izlemenizi sağlar.',
    icon: FiHelpCircle,
  },
  {
    question: 'Nasıl giriş yapabilirim?',
    answer: 'Size verilen Site Adı, Kullanıcı Adı ve Şifre bilgileri ile giriş ekranından sisteme dahil olabilirsiniz. Bu bilgiler size özeldir ve paylaşılmamalıdır.',
    icon: FiPlay,
  },
  {
    question: 'Hangi cihazlarda çalışır?',
    answer: 'Mutlu Player; telefon, tablet, bilgisayar ve Android TV dahil tüm modern cihazlarda sorunsuz çalışır. İnternet tarayıcınızın güncel olması yeterlidir.',
    icon: FiSmartphone,
  },
  {
    question: 'Başka bir IPTV linki kabul olur mu?',
    answer: 'Hayır, kabul olmaz. Mutlu Player sadece Mutlu IPTV\'ye ait yayın linkleri ile çalışır. Harici M3U linkleri veya başka sağlayıcılar desteklenmez.',
    icon: FiX,
  },
  {
    question: 'M3U linkim başka player\'da çalışır mı?',
    answer: 'Evet, Mutlu IPTV size özel M3U linkiniz VLC, Tivimate, IPTV Smarters gibi popüler player\'larda da çalışır. Ancak en iyi deneyim için Mutlu Player\'ı öneririz.',
    icon: FiCheck,
  },
  {
    question: 'İnternet hızım ne kadar olmalı?',
    answer: 'Kesintisiz bir yayın deneyimi için minimum 8 Mbps internet hızı önerilir. HD yayınlar için 16 Mbps ve üzeri daha iyi sonuç verir.',
    icon: FiWifi,
  },
  {
    question: 'Yayın donuyor veya açılmıyor, ne yapmalıyım?',
    answer: 'Öncelikle internet bağlantınızı kontrol edin. Sorun devam ederse sayfayı yenileyin veya farklı bir tarayıcı deneyin. Hala çözülmezse admin ile iletişime geçin.',
    icon: FiAlertCircle,
  },
  {
    question: 'Favorilere nasıl kanal eklerim?',
    answer: 'Herhangi bir kanalın üzerindeki kalp ❤️ simgesine tıklayarak favorilerinize ekleyebilirsiniz. Favorileriniz ayrı bir sayfada listelenir ve hızlı erişim sağlar.',
    icon: FiHelpCircle,
  },
  {
    question: 'Adult içerik nasıl çalışır?',
    answer: 'Adult bölümüne erişmek için 4 haneli bir PIN kodu oluşturmanız gerekir. Bu PIN size özeldir ve istediğiniz zaman değiştirebilirsiniz.',
    icon: FiAlertCircle,
  },
  {
    question: 'Şifremi unuttum, ne yapmalıyım?',
    answer: 'Şifrenizi sıfırlamak için Telegram üzerinden admin ile iletişime geçin: @mutluadmin. Size yeni şifre bilgileriniz iletilecektir.',
    icon: FiHelpCircle,
  },
  {
    question: 'Aynı anda kaç cihazdan bağlanabilirim?',
    answer: 'Mutlu Player tek cihaz desteği sunar. Aynı anda birden fazla cihazdan giriş yapılamaz.',
    icon: FiTv,
  },
  {
    question: 'Telefonuma uygulama olarak kurabilir miyim?',
    answer: 'Evet! Tarayıcınızdan siteye girdikten sonra "Ana Ekrana Ekle" seçeneği ile Mutlu Player\'ı telefonunuza uygulama gibi kurabilirsiniz.',
    icon: FiSmartphone,
  },
  {
    question: 'Yeni kanal ekleniyor mu?',
    answer: 'Evet, kanal listemiz düzenli olarak güncellenir ve yeni kanallar eklenir. Güncellemeler otomatik olarak hesabınıza yansır.',
    icon: FiLink,
  },
];

export default function NasilKullanilirPage() {
  return (
    <MainLayout>
      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiHelpCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">Nasıl Kullanılır?</h1>
          <p className="text-gray-400 mt-2 text-sm">Sıkça Sorulan Sorular ve Cevapları</p>
        </div>

        {/* SSS Listesi */}
        <div className="space-y-3">
          {faqData.map((item, index) => (
            <div
              key={index}
              className="glass-card p-5 hover:border-gray-700/50 transition-all duration-200"
            >
              <div className="flex items-start space-x-4">
                {/* İkon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  item.icon === FiX ? 'bg-red-500/10' :
                  item.icon === FiCheck ? 'bg-green-500/10' :
                  item.icon === FiAlertCircle ? 'bg-yellow-500/10' :
                  'bg-blue-500/10'
                }`}>
                  <item.icon className={`w-5 h-5 ${
                    item.icon === FiX ? 'text-red-400' :
                    item.icon === FiCheck ? 'text-green-400' :
                    item.icon === FiAlertCircle ? 'text-yellow-400' :
                    'text-blue-400'
                  }`} />
                </div>

                {/* İçerik */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold mb-2">
                    {item.question}
                  </h3>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Alt bilgi */}
        <div className="text-center mt-10 p-6 glass-card">
          <p className="text-gray-400 text-sm mb-3">
            Başka bir sorunuz mu var?
          </p>
          <a
            href="https://t.me/mutluadmin"
            target="_blank"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl text-sm font-medium transition-colors"
          >
            <span>Admin ile İletişime Geç</span>
            <span>→</span>
          </a>
          <p className="text-gray-600 text-xs mt-3">
            Telegram: @mutluadmin
          </p>
        </div>

        {/* Versiyon */}
        <div className="text-center mt-6">
          <p className="text-gray-600 text-xs">
            Mutlu Player v1.0.0 • Sadece Mutlu IPTV için
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
