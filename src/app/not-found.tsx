import Link from 'next/link';
import { FiHome } from 'react-icons/fi';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl mb-6">📡</div>
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <h2 className="text-xl text-gray-400 mb-6">Sayfa Bulunamadı</h2>
        <p className="text-gray-500 mb-8 max-w-md">
          Aradığınız sayfa kaldırılmış, adı değiştirilmiş veya geçici olarak kullanılamıyor olabilir.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors"
        >
          <FiHome className="w-5 h-5" />
          <span>Ana Sayfaya Dön</span>
        </Link>
      </div>
    </div>
  );
}
