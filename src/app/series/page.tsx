'use client';

import MainLayout from '@/components/Layout/MainLayout';
import { FiMonitor } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function SeriesPage() {
  const router = useRouter();

  return (
    <MainLayout>
      <div className="p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-2">Diziler</h1>
        <p className="text-gray-400 mb-6">Yakında eklenecek</p>
        
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mb-6">
            <FiMonitor className="w-10 h-10 text-purple-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Dizi Kategorisi</h2>
          <p className="text-gray-400 text-center max-w-md mb-6">
            Bu özellik henüz geliştirme aşamasında. Çok yakında sizlerle!
          </p>
          <button
            onClick={() => router.push('/live-tv')}
            className="px-6 py-3 bg-purple-500 rounded-xl text-sm"
          >
            Canlı TV'ye Git
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
