'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react';

interface Category { id: string; name: string; icon: string; color: string }

const PRESET_COLORS = ['#ff6b2b','#a855f7','#22c55e','#3b82f6','#eab308','#ef4444','#06b6d4','#ec4899'];

export default function AdminCategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', icon: '📍', color: '#ff6b2b' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const res = await fetch('/api/admin/categories');
    const data = await res.json();
    setTimeout(() => { setCats(data); setLoading(false); }, 0);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const add = async () => {
    if (!form.name.trim()) { setError('İsim gerekli'); return; }
    setSaving(true); setError('');
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) { setForm({ name: '', icon: '📍', color: '#ff6b2b' }); await load(); }
    else { const d = await res.json(); setError(d.error); }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm('Kategoriyi sil?')) return;
    await fetch('/api/admin/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await load();
  };

  const card = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' };
  const inp = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' };

  return (
    <div className="min-h-screen px-4 py-8 max-w-3xl mx-auto" style={{ background: '#0a0a0f' }}>
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-white/30 hover:text-white/60 text-sm mb-6 transition-colors">
        <ArrowLeft size={14} /> Admin Paneli
      </Link>
      <h1 className="text-2xl font-black text-white mb-6">Kategoriler</h1>

      {/* Yeni kategori */}
      <div className="rounded-2xl p-5 mb-6" style={card}>
        <h2 className="font-bold text-white mb-4">Yeni Kategori</h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-white/50 text-xs mb-1 block">İsim</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Kafe, Müze..."
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none"
              style={inp} />
          </div>
          <div>
            <label className="text-white/50 text-xs mb-1 block">İkon (emoji)</label>
            <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}
              placeholder="☕"
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none text-center text-lg"
              style={inp} />
          </div>
        </div>
        <div className="mb-4">
          <label className="text-white/50 text-xs mb-2 block">Renk</label>
          <div className="flex gap-2 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button key={c} onClick={() => setForm({ ...form, color: c })}
                className="w-8 h-8 rounded-full transition-all"
                style={{ background: c, outline: form.color === c ? `3px solid white` : 'none', outlineOffset: '2px' }} />
            ))}
          </div>
        </div>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <button onClick={add} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Ekle
        </button>
      </div>

      {/* Listele */}
      <div className="rounded-2xl overflow-hidden" style={card}>
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="font-bold text-white">Mevcut Kategoriler</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-white/20">Yükleniyor...</div>
        ) : (
          <div className="divide-y divide-white/5">
            {cats.map((cat) => (
              <div key={cat.id} className="px-5 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: cat.color + '20' }}>
                  {cat.icon}
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">{cat.name}</div>
                  <div className="text-white/30 text-xs">#{cat.id}</div>
                </div>
                <div className="w-4 h-4 rounded-full" style={{ background: cat.color }} />
                <button onClick={() => remove(cat.id)} className="text-white/20 hover:text-red-400 transition-colors p-2">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
