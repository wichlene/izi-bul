import Link from 'next/link';
import { MapPin } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-7xl mb-6">🗺️</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Sayfa bulunamadı</h1>
        <p className="text-gray-500 mb-6">Aradığın konum bu haritada yok.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-3 rounded-xl transition-colors"
        >
          <MapPin size={16} />
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}
