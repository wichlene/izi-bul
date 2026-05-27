'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loader2, Check } from 'lucide-react';
import { Category, DIFFICULTIES, Difficulty } from '@/types';
import PhotoUpload from '@/components/PhotoUpload';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

interface Props {
  categories: Category[];
}

export default function CreateQuestForm({ categories }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    category_id: 'bridge',
    title: '',
    description: '',
    hint: '',
    region: '',
    difficulty: 'medium' as Difficulty,
    cash_reward: '0',
    max_distance_meters: '50',
    requires_photo_proof: true,
  });
  const [photoUrl, setPhotoUrl] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title || !form.description || !photoUrl || !lat || !lng) {
      setError('Lütfen tüm zorunlu alanları doldurun ve konumu seçin.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          photo_url: photoUrl,
          latitude: lat,
          longitude: lng,
          cash_reward: parseInt(form.cash_reward) || 0,
          max_distance_meters: parseInt(form.max_distance_meters),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/quest/${data.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-900 mb-3">Kategori</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => set('category_id', cat.id)}
              className={`p-3 rounded-xl border text-sm font-medium transition-all flex flex-col items-center gap-1 ${
                form.category_id === cat.id
                  ? 'text-white border-transparent'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
              style={form.category_id === cat.id ? { backgroundColor: cat.color } : {}}
            >
              <span className="text-xl">{cat.icon}</span>
              <span className="text-xs">{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Görev Başlığı <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Örn: Bu köprü nerede?"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Açıklama <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            placeholder="Görev hakkında detaylı bilgi..."
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Bölge</label>
            <input
              type="text"
              value={form.region}
              onChange={(e) => set('region', e.target.value)}
              placeholder="İstanbul / Anadolu"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">İpucu</label>
            <input
              type="text"
              value={form.hint}
              onChange={(e) => set('hint', e.target.value)}
              placeholder="Bir ipucu..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-900 mb-1">
          Görev Fotoğrafı <span className="text-red-500">*</span>
        </h2>
        <p className="text-gray-400 text-sm mb-3">
          Oyuncuların göreceği gizemli fotoğraf. Adres/tabela görünmesin!
        </p>
        <PhotoUpload onUpload={setPhotoUrl} />
        {photoUrl && (
          <p className="flex items-center gap-1.5 text-green-600 text-sm mt-2">
            <Check size={14} /> Fotoğraf yüklendi
          </p>
        )}
      </section>

      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-900 mb-1">
          Gizli Konum <span className="text-red-500">*</span>
        </h2>
        <p className="text-gray-400 text-sm mb-3">Haritaya tıkla, doğru konuma pin bırak.</p>
        <div className="h-64 rounded-xl overflow-hidden border border-gray-200">
          <MapPicker
            onLocationSelect={(la, ln) => { setLat(la); setLng(ln); }}
            markerColor="#ef4444"
          />
        </div>
        {lat && lng && (
          <p className="flex items-center gap-1.5 text-green-600 text-sm mt-2">
            <Check size={14} /> Konum işaretlendi
          </p>
        )}
      </section>

      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-900 mb-3">Zorluk</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(DIFFICULTIES) as Difficulty[]).map((k) => {
            const d = DIFFICULTIES[k];
            return (
              <button
                key={k}
                onClick={() => set('difficulty', k)}
                className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                  form.difficulty === k
                    ? 'text-white border-transparent'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
                style={form.difficulty === k ? { backgroundColor: d.color } : {}}
              >
                <div>{d.label}</div>
                <div className="text-xs opacity-80">{d.points} puan</div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
        <div>
          <h2 className="font-bold text-gray-900 mb-1">Ekstra Nakit Ödül</h2>
          <p className="text-gray-400 text-sm mb-2">İsteğe bağlı — puana ek olarak nakit (TL)</p>
          <input
            type="number"
            value={form.cash_reward}
            onChange={(e) => set('cash_reward', e.target.value)}
            placeholder="0"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <div>
          <h2 className="font-bold text-gray-900 mb-3">Yakınlık (metre)</h2>
          <div className="grid grid-cols-4 gap-2">
            {['20', '50', '100', '200'].map((m) => (
              <button
                key={m}
                onClick={() => set('max_distance_meters', m)}
                className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  form.max_distance_meters === m
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.requires_photo_proof}
            onChange={(e) => set('requires_photo_proof', e.target.checked)}
            className="w-4 h-4 text-orange-500 rounded"
          />
          <span className="text-sm text-gray-700">Fotoğraf kanıtı zorunlu olsun</span>
        </label>
      </section>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 text-white font-bold py-4 rounded-2xl text-lg transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <><Loader2 size={20} className="animate-spin" /> Yayınlanıyor...</>
        ) : (
          'Görevi Yayınla 🚀'
        )}
      </button>
    </div>
  );
}
