'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, MapPin, Loader2, Check } from 'lucide-react';
import PhotoUpload from '@/components/PhotoUpload';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

export default function CreatePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    cafe_name: '',
    description: '',
    hint: '',
    reward: '',
    reward_type: 'product' as 'product' | 'cash',
    reward_amount: '',
    max_distance_meters: '150',
  });
  const [photoUrl, setPhotoUrl] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.cafe_name || !form.description || !form.reward || !photoUrl || !lat || !lng) {
      setError('Lütfen tüm zorunlu alanları doldurun ve haritada konumu işaretleyin.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          photo_url: photoUrl,
          latitude: lat,
          longitude: lng,
          reward_amount: form.reward_amount ? parseInt(form.reward_amount) : null,
          max_distance_meters: parseInt(form.max_distance_meters),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/challenge/${data.id}?created=1`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="bg-orange-500 text-white rounded-xl p-1.5">
              <MapPin size={18} />
            </div>
            <span className="text-lg font-bold text-gray-900">Konum Yayınla</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Kafe Bilgileri */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4">İşletme Bilgileri</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                İşletme Adı <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Örn: Mandabatmaz Kahve"
                value={form.cafe_name}
                onChange={(e) => set('cafe_name', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Açıklama <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Kullanıcılara ipucu verecek bir açıklama yaz..."
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Ekstra İpucu <span className="text-gray-400 font-normal">(opsiyonel)</span>
              </label>
              <input
                type="text"
                placeholder="Örn: Tarihi bir çarşının içinde"
                value={form.hint}
                onChange={(e) => set('hint', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>
        </section>

        {/* Fotoğraf */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-1">
            Konum Fotoğrafı <span className="text-red-500">*</span>
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            Konumun içinden veya dışından karakteristik bir fotoğraf çek. Adres görünmesin!
          </p>
          <PhotoUpload onUpload={setPhotoUrl} />
          {photoUrl && (
            <p className="flex items-center gap-1.5 text-green-600 text-sm mt-2">
              <Check size={14} /> Fotoğraf yüklendi
            </p>
          )}
        </section>

        {/* Gizli Konum */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-1">
            Gizli Konum <span className="text-red-500">*</span>
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            Haritada gerçek konumuna tıkla. Bu bilgi kullanıcılardan gizlenir.
          </p>
          <div className="h-72 rounded-xl overflow-hidden border border-gray-200">
            <MapPicker
              onLocationSelect={(lat, lng) => { setLat(lat); setLng(lng); }}
              markerColor="#ef4444"
            />
          </div>
          {lat && (
            <p className="flex items-center gap-1.5 text-green-600 text-sm mt-2">
              <Check size={14} /> Konum işaretlendi ({lat.toFixed(5)}, {lng?.toFixed(5)})
            </p>
          )}
        </section>

        {/* Ödül */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4">Ödül</h2>
          <div className="space-y-3">
            <div className="flex gap-3">
              <button
                onClick={() => set('reward_type', 'product')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${form.reward_type === 'product' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'}`}
              >
                Ürün / Hizmet
              </button>
              <button
                onClick={() => set('reward_type', 'cash')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${form.reward_type === 'cash' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'}`}
              >
                Nakit Ödül
              </button>
            </div>

            <input
              type="text"
              placeholder={form.reward_type === 'cash' ? 'Örn: 500₺ nakit ödül' : 'Örn: 1 adet filtre kahve'}
              value={form.reward}
              onChange={(e) => set('reward', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />

            {form.reward_type === 'cash' && (
              <input
                type="number"
                placeholder="Tutar (₺)"
                value={form.reward_amount}
                onChange={(e) => set('reward_amount', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            )}
          </div>
        </section>

        {/* Zorluk */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-1">Kazanma Mesafesi</h2>
          <p className="text-gray-400 text-sm mb-4">
            Kullanıcının konuma kaç metre yakın olması gerekiyor?
          </p>
          <div className="flex gap-3">
            {['50', '100', '150', '300'].map((m) => (
              <button
                key={m}
                onClick={() => set('max_distance_meters', m)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${form.max_distance_meters === m ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'}`}
              >
                {m}m
              </button>
            ))}
          </div>
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl text-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 size={20} className="animate-spin" /> Yayınlanıyor...</>
          ) : (
            'Challengeı Yayınla 🚀'
          )}
        </button>
      </main>
    </div>
  );
}
