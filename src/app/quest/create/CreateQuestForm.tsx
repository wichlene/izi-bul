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

  const sectionStyle = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' };
  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl p-5" style={sectionStyle}>
        <h2 className="font-bold text-white mb-3">Kategori</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => set('category_id', cat.id)}
              className="p-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1"
              style={form.category_id === cat.id
                ? { background: cat.color + '30', border: `1px solid ${cat.color}60`, color: cat.color }
                : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }
              }
            >
              <span className="text-xl">{cat.icon}</span>
              <span className="text-xs">{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl p-5 space-y-3" style={sectionStyle}>
        <div>
          <label className="text-white/60 text-sm font-medium block mb-1.5">
            Görev Başlığı <span style={{ color: '#f87171' }}>*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Örn: Bu köprü nerede?"
            className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none transition-all"
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = 'rgba(255,107,43,0.5)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
          />
        </div>
        <div>
          <label className="text-white/60 text-sm font-medium block mb-1.5">
            Açıklama <span style={{ color: '#f87171' }}>*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            placeholder="Görev hakkında detaylı bilgi..."
            className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none transition-all resize-none"
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = 'rgba(255,107,43,0.5)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Bölge', key: 'region', ph: 'İstanbul / Anadolu' },
            { label: 'İpucu', key: 'hint', ph: 'Bir ipucu...' },
          ].map(({ label, key, ph }) => (
            <div key={key}>
              <label className="text-white/60 text-sm font-medium block mb-1.5">{label}</label>
              <input
                type="text"
                value={form[key as keyof typeof form] as string}
                onChange={(e) => set(key, e.target.value)}
                placeholder={ph}
                className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none transition-all"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'rgba(255,107,43,0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl p-5" style={sectionStyle}>
        <h2 className="font-bold text-white mb-1">
          Görev Fotoğrafı <span style={{ color: '#f87171' }}>*</span>
        </h2>
        <p className="text-white/30 text-sm mb-3">Oyuncuların göreceği gizemli fotoğraf. Adres/tabela görünmesin!</p>
        <PhotoUpload onUpload={setPhotoUrl} />
        {photoUrl && (
          <p className="flex items-center gap-1.5 text-sm mt-2" style={{ color: '#22c55e' }}>
            <Check size={14} /> Fotoğraf yüklendi
          </p>
        )}
      </section>

      <section className="rounded-2xl p-5" style={sectionStyle}>
        <h2 className="font-bold text-white mb-1">
          Gizli Konum <span style={{ color: '#f87171' }}>*</span>
        </h2>
        <p className="text-white/30 text-sm mb-3">Haritaya tıkla, doğru konuma pin bırak.</p>
        <div className="h-64 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <MapPicker
            onLocationSelect={(la, ln) => { setLat(la); setLng(ln); }}
          />
        </div>
        {lat && lng && (
          <p className="flex items-center gap-1.5 text-sm mt-2" style={{ color: '#22c55e' }}>
            <Check size={14} /> Konum işaretlendi
          </p>
        )}
      </section>

      <section className="rounded-2xl p-5" style={sectionStyle}>
        <h2 className="font-bold text-white mb-3">Zorluk</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(DIFFICULTIES) as Difficulty[]).map((k) => {
            const d = DIFFICULTIES[k];
            const active = form.difficulty === k;
            return (
              <button
                key={k}
                onClick={() => set('difficulty', k)}
                className="p-3 rounded-xl text-sm font-medium transition-all"
                style={active
                  ? { background: d.color + '25', border: `1px solid ${d.color}50`, color: d.color }
                  : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }
                }
              >
                <div>{d.label}</div>
                <div className="text-xs opacity-70">{d.points} puan</div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl p-5 space-y-4" style={sectionStyle}>
        <div>
          <h2 className="font-bold text-white mb-1">Ekstra Nakit Ödül</h2>
          <p className="text-white/30 text-sm mb-2">İsteğe bağlı — puana ek olarak nakit (TL)</p>
          <input
            type="number"
            value={form.cash_reward}
            onChange={(e) => set('cash_reward', e.target.value)}
            placeholder="0"
            className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none transition-all"
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = 'rgba(255,107,43,0.5)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
          />
        </div>
        <div>
          <h2 className="font-bold text-white mb-3">Yakınlık (metre)</h2>
          <div className="grid grid-cols-4 gap-2">
            {['20', '50', '100', '200'].map((m) => (
              <button
                key={m}
                onClick={() => set('max_distance_meters', m)}
                className="py-2.5 rounded-xl text-sm font-medium transition-all"
                style={form.max_distance_meters === m
                  ? { background: 'rgba(255,107,43,0.2)', border: '1px solid rgba(255,107,43,0.4)', color: '#ff6b2b' }
                  : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }
                }
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
            className="w-4 h-4 rounded"
            style={{ accentColor: '#ff6b2b' }}
          />
          <span className="text-sm text-white/50">Fotoğraf kanıtı zorunlu olsun</span>
        </label>
      </section>

      {error && (
        <div className="rounded-xl p-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full font-black py-4 rounded-2xl text-lg transition-all text-white flex items-center justify-center gap-2"
        style={{ background: loading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}
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
