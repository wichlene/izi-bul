'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loader2, Check, Plus, Trash2, Route } from 'lucide-react';
import { Category, DIFFICULTIES, Difficulty } from '@/types';
import PhotoUpload from '@/components/PhotoUpload';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

interface Props {
  categories: Category[];
}

interface StepDraft {
  step_type: 'question' | 'location';
  question: string;
  correct_answer: string;
  latitude: number | null;
  longitude: number | null;
  approach_radius_meters: number;
  hint: string;
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
    expires_at: '',
  });
  const [photoUrl, setPhotoUrl] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [multistep, setMultistep] = useState(false);
  const [steps, setSteps] = useState<StepDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const addStep = () => setSteps((s) => [...s, {
    step_type: 'question', question: '', correct_answer: '', latitude: null, longitude: null,
    approach_radius_meters: Math.max(1500 - s.length * 500, 300), hint: '',
  }]);
  const updStep = (i: number, patch: Partial<StepDraft>) => setSteps((s) => s.map((st, idx) => idx === i ? { ...st, ...patch } : st));
  const delStep = (i: number) => setSteps((s) => s.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!form.title || !form.description || !photoUrl || !lat || !lng) {
      setError('Lütfen tüm zorunlu alanları doldurun ve son konumu seçin.');
      return;
    }
    if (multistep) {
      for (const [i, st] of steps.entries()) {
        if (!st.latitude || !st.longitude) { setError(`${i + 1}. adımın konumunu haritadan seç.`); return; }
        if (st.step_type === 'question' && (!st.question || !st.correct_answer)) { setError(`${i + 1}. adımın soru ve cevabını gir.`); return; }
      }
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
          expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
          steps: multistep ? steps.map((s) => ({
            step_type: s.step_type,
            question: s.question || null,
            correct_answer: s.correct_answer || null,
            latitude: s.latitude,
            longitude: s.longitude,
            approach_radius_meters: s.approach_radius_meters,
            hint: s.hint || null,
          })) : undefined,
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

  const section = { background: '#ffffff', border: '1px solid #eff3f4' };
  const input = { background: '#f7f8f8', border: '1px solid #eff3f4', color: '#0f1419' };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl p-5" style={section}>
        <h2 className="font-bold mb-3" style={{ color: '#0f1419' }}>Kategori</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => set('category_id', cat.id)}
              className="p-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1"
              style={form.category_id === cat.id
                ? { background: cat.color + '20', border: `1px solid ${cat.color}60`, color: cat.color }
                : { background: '#f7f8f8', border: '1px solid #eff3f4', color: '#536471' }}>
              <span className="text-xl">{cat.icon}</span>
              <span className="text-xs">{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl p-5 space-y-3" style={section}>
        <div>
          <label className="text-sm font-medium block mb-1.5" style={{ color: '#536471' }}>Görev Başlığı <span style={{ color: '#f87171' }}>*</span></label>
          <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Örn: Bu köprü nerede?"
            className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={input} />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5" style={{ color: '#536471' }}>Açıklama <span style={{ color: '#f87171' }}>*</span></label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} placeholder="Görev hakkında detaylı bilgi..."
            className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none resize-none" style={input} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: '#536471' }}>Bölge</label>
            <input type="text" value={form.region} onChange={(e) => set('region', e.target.value)} placeholder="İstanbul / Anadolu"
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={input} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: '#536471' }}>İpucu</label>
            <input type="text" value={form.hint} onChange={(e) => set('hint', e.target.value)} placeholder="Bir ipucu..."
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={input} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl p-5" style={section}>
        <h2 className="font-bold mb-1" style={{ color: '#0f1419' }}>Görev Fotoğrafı <span style={{ color: '#f87171' }}>*</span></h2>
        <p className="text-sm mb-3" style={{ color: '#536471' }}>Oyuncuların göreceği gizemli fotoğraf. Adres/tabela görünmesin!</p>
        <PhotoUpload onUpload={setPhotoUrl} />
        {photoUrl && <p className="flex items-center gap-1.5 text-sm mt-2" style={{ color: '#22c55e' }}><Check size={14} /> Fotoğraf yüklendi</p>}
      </section>

      <section className="rounded-2xl p-5" style={section}>
        <h2 className="font-bold mb-3" style={{ color: '#0f1419' }}>Zorluk</h2>
        <p className="text-xs mb-3" style={{ color: '#536471' }}>Zorluk arttıkça son nokta yakınlık alanı daralır (easy 100m → legendary 25m).</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(DIFFICULTIES) as Difficulty[]).map((k) => {
            const d = DIFFICULTIES[k];
            const active = form.difficulty === k;
            return (
              <button key={k} onClick={() => set('difficulty', k)} className="p-3 rounded-xl text-sm font-medium transition-all"
                style={active ? { background: d.color + '20', border: `1px solid ${d.color}50`, color: d.color } : { background: '#f7f8f8', border: '1px solid #eff3f4', color: '#536471' }}>
                <div>{d.label}</div>
                <div className="text-xs opacity-70">{d.points} puan</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ÇOK ADIMLI GÖREV */}
      <section className="rounded-2xl p-5" style={section}>
        <label className="flex items-center justify-between cursor-pointer mb-1">
          <span className="font-bold flex items-center gap-2" style={{ color: '#0f1419' }}><Route size={16} style={{ color: '#ff6b2b' }} /> Çok Adımlı Görev</span>
          <input type="checkbox" checked={multistep} onChange={(e) => { setMultistep(e.target.checked); if (e.target.checked && steps.length === 0) addStep(); }}
            className="w-5 h-5 rounded" style={{ accentColor: '#ff6b2b' }} />
        </label>
        <p className="text-sm" style={{ color: '#536471' }}>
          Açarsan kullanıcı sırayla noktalara gider; her adımda soru/konum çözer, alan daralır. Son adım her zaman aşağıdaki gizli konumdur.
        </p>

        {multistep && (
          <div className="mt-4 space-y-4">
            {steps.map((st, i) => (
              <div key={i} className="rounded-xl p-4" style={{ background: '#f7f8f8', border: '1px solid #eff3f4' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-sm" style={{ color: '#0f1419' }}>Adım {i + 1}</span>
                  <button onClick={() => delStep(i)} className="p-1.5 rounded-lg" style={{ color: '#ef4444' }}><Trash2 size={14} /></button>
                </div>
                <div className="flex gap-2 mb-3">
                  {(['question', 'location'] as const).map((t) => (
                    <button key={t} onClick={() => updStep(i, { step_type: t })}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={st.step_type === t ? { background: 'rgba(255,107,43,0.1)', color: '#ff6b2b' } : { background: '#fff', color: '#536471', border: '1px solid #eff3f4' }}>
                      {t === 'question' ? '❓ Soru' : '📍 Sadece Konum'}
                    </button>
                  ))}
                </div>
                {st.step_type === 'question' && (
                  <div className="space-y-2 mb-3">
                    <input value={st.question} onChange={(e) => updStep(i, { question: e.target.value })} placeholder="Soru (örn: Bu heykelin adı ne?)"
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: '#fff', border: '1px solid #eff3f4', color: '#0f1419' }} />
                    <input value={st.correct_answer} onChange={(e) => updStep(i, { correct_answer: e.target.value })} placeholder="Doğru cevap"
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ background: '#fff', border: '1px solid #eff3f4', color: '#0f1419' }} />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs" style={{ color: '#536471' }}>Yakınlık:</span>
                  {[1500, 800, 400, 200].map((r) => (
                    <button key={r} onClick={() => updStep(i, { approach_radius_meters: r })}
                      className="px-2 py-1 rounded-lg text-xs font-semibold"
                      style={st.approach_radius_meters === r ? { background: 'rgba(255,107,43,0.1)', color: '#ff6b2b' } : { background: '#fff', color: '#536471', border: '1px solid #eff3f4' }}>
                      {r}m
                    </button>
                  ))}
                </div>
                <div className="h-44 rounded-lg overflow-hidden" style={{ border: '1px solid #eff3f4' }}>
                  <MapPicker onLocationSelect={(la, ln) => updStep(i, { latitude: la, longitude: ln })} initialLat={st.latitude || undefined} initialLng={st.longitude || undefined} />
                </div>
                {st.latitude && <p className="flex items-center gap-1.5 text-xs mt-1.5" style={{ color: '#22c55e' }}><Check size={12} /> Konum seçildi</p>}
              </div>
            ))}
            <button onClick={addStep} className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5" style={{ background: 'rgba(255,107,43,0.08)', color: '#ff6b2b', border: '1px dashed rgba(255,107,43,0.3)' }}>
              <Plus size={15} /> Adım Ekle
            </button>
          </div>
        )}
      </section>

      <section className="rounded-2xl p-5" style={section}>
        <h2 className="font-bold mb-1" style={{ color: '#0f1419' }}>{multistep ? 'Son Nokta — Gizli Konum' : 'Gizli Konum'} <span style={{ color: '#f87171' }}>*</span></h2>
        <p className="text-sm mb-3" style={{ color: '#536471' }}>Hazinenin olduğu nokta. Haritaya tıkla, pin bırak.</p>
        <div className="h-64 rounded-xl overflow-hidden" style={{ border: '1px solid #eff3f4' }}>
          <MapPicker onLocationSelect={(la, ln) => { setLat(la); setLng(ln); }} initialLat={lat || undefined} initialLng={lng || undefined} />
        </div>
        {lat && lng && <p className="flex items-center gap-1.5 text-sm mt-2" style={{ color: '#22c55e' }}><Check size={14} /> Konum işaretlendi</p>}
      </section>

      <section className="rounded-2xl p-5 space-y-4" style={section}>
        <div>
          <h2 className="font-bold mb-1" style={{ color: '#0f1419' }}>Ekstra Nakit Ödül</h2>
          <p className="text-sm mb-2" style={{ color: '#536471' }}>İsteğe bağlı — puana ek nakit (TL). Ortak görevde eşit bölünür.</p>
          <input type="number" value={form.cash_reward} onChange={(e) => set('cash_reward', e.target.value)} placeholder="0"
            className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={input} />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.requires_photo_proof} onChange={(e) => set('requires_photo_proof', e.target.checked)} className="w-4 h-4 rounded" style={{ accentColor: '#ff6b2b' }} />
          <span className="text-sm" style={{ color: '#536471' }}>Son noktada fotoğraf kanıtı zorunlu olsun</span>
        </label>
        <div>
          <h2 className="font-bold mb-1" style={{ color: '#0f1419' }}>Bitiş Tarihi</h2>
          <p className="text-sm mb-2" style={{ color: '#536471' }}>İsteğe bağlı — bu tarihten sonra görev kapanır</p>
          <input type="datetime-local" value={form.expires_at} onChange={(e) => set('expires_at', e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={input} />
        </div>
      </section>

      {error && <div className="rounded-xl p-3 text-sm" style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626' }}>{error}</div>}

      <button onClick={handleSubmit} disabled={loading}
        className="w-full font-black py-4 rounded-2xl text-lg text-white flex items-center justify-center gap-2"
        style={{ background: loading ? '#ccc' : 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}>
        {loading ? <><Loader2 size={20} className="animate-spin" /> Yayınlanıyor...</> : 'Görevi Yayınla 🚀'}
      </button>
    </div>
  );
}
