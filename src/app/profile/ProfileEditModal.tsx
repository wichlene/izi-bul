'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, Pencil } from 'lucide-react';

interface Props {
  initialData: {
    full_name: string | null;
    username: string | null;
    city: string | null;
    bio: string | null;
  };
}

export default function ProfileEditModal({ initialData }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: initialData.full_name || '',
    username: initialData.username || '',
    city: initialData.city || '',
    bio: initialData.bio || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setError('');
    setLoading(true);
    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Hata oluştu'); return; }
    setOpen(false);
    router.refresh();
  };

  const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all";
  const inputStyle = { background: '#f7f8f8', border: '1px solid #eff3f4', color: '#0f1419' };
  const focusStyle = { borderColor: '#ff6b2b' };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold border transition-colors hover:bg-gray-50"
        style={{ color: '#0f1419', borderColor: '#cfd9de' }}>
        <Pencil size={13} /> Profili Düzenle
      </button>

      {open && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: '#fff' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #eff3f4' }}>
              <div className="flex items-center gap-6">
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-full hover:bg-gray-100" style={{ color: '#536471' }}>
                  <X size={18} />
                </button>
                <span className="font-black text-base" style={{ color: '#0f1419' }}>Profili Düzenle</span>
              </div>
              <button
                onClick={save}
                disabled={loading}
                className="px-4 py-1.5 rounded-full text-sm font-black text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
                {loading ? <Loader2 size={14} className="animate-spin" /> : 'Kaydet'}
              </button>
            </div>

            {/* Form */}
            <div className="px-4 py-4 space-y-4">
              {[
                { label: 'Ad Soyad', key: 'full_name', placeholder: 'Ahmet Yılmaz', maxLength: 60 },
                { label: 'Kullanıcı Adı', key: 'username', placeholder: 'ahmetylmz', maxLength: 30 },
                { label: 'Şehir', key: 'city', placeholder: 'İstanbul', maxLength: 60 },
              ].map(({ label, key, placeholder, maxLength }) => (
                <div key={key}>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: '#536471' }}>{label}</label>
                  <input
                    type="text"
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    maxLength={maxLength}
                    placeholder={placeholder}
                    className={inputCls}
                    style={inputStyle}
                    onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                    onBlur={(e) => (e.target.style.borderColor = '#eff3f4')}
                  />
                </div>
              ))}

              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: '#536471' }}>
                  Bio <span style={{ color: '#aaa' }}>({form.bio.length}/160)</span>
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  maxLength={160}
                  rows={3}
                  placeholder="Kendini kısaca tanıt..."
                  className={`${inputCls} resize-none`}
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                  onBlur={(e) => (e.target.style.borderColor = '#eff3f4')}
                />
              </div>

              {error && (
                <p className="text-sm px-1" style={{ color: '#ef4444' }}>{error}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
