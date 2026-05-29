'use client';

import { useState } from 'react';
import { Loader2, CheckCircle, Send } from 'lucide-react';

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', business_name: '', message: '', type: 'business' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const input = { background: '#f7f8f8', border: '1px solid #eff3f4', color: '#0f1419' };

  const submit = async () => {
    if (!form.name.trim() || !form.message.trim()) { setError('İsim ve mesaj zorunlu.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Hata');
      setDone(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Hata'); }
    finally { setLoading(false); }
  };

  if (done) return (
    <div className="text-center py-8">
      <CheckCircle size={40} className="mx-auto mb-3" style={{ color: '#22c55e' }} />
      <h3 className="font-black text-lg" style={{ color: '#0f1419' }}>Mesajın alındı!</h3>
      <p className="text-sm mt-1" style={{ color: '#536471' }}>En kısa sürede dönüş yapacağız.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {[['business', '🏪 İşletme'], ['investor', '💰 Yatırımcı'], ['general', '💬 Genel']].map(([v, l]) => (
          <button key={v} onClick={() => set('type', v)}
            className="py-2 rounded-xl text-sm font-semibold transition-colors"
            style={form.type === v ? { background: 'rgba(255,107,43,0.1)', color: '#ff6b2b', border: '1px solid rgba(255,107,43,0.3)' } : { background: '#f7f8f8', color: '#536471', border: '1px solid #eff3f4' }}>
            {l}
          </button>
        ))}
      </div>
      <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Adın *" className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={input} />
      <div className="grid grid-cols-2 gap-2">
        <input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="E-posta" className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={input} />
        <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Telefon" className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={input} />
      </div>
      <input value={form.business_name} onChange={(e) => set('business_name', e.target.value)} placeholder="İşletme adı (varsa)" className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={input} />
      <textarea value={form.message} onChange={(e) => set('message', e.target.value)} rows={4} placeholder="Mesajın *" className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none resize-none" style={input} />
      {error && <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>}
      <button onClick={submit} disabled={loading} className="w-full font-bold py-3 rounded-xl text-white flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
        {loading ? <><Loader2 size={16} className="animate-spin" /> Gönderiliyor...</> : <><Send size={15} /> Gönder</>}
      </button>
    </div>
  );
}
