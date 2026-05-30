'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, Pencil, Lock, Eye, EyeOff, MessageCircle, MapPin, Bell, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  initialData: {
    full_name: string | null;
    username: string | null;
    city: string | null;
    bio: string | null;
    location_visible?: boolean;
    messages_from?: string | null;
    show_activity?: boolean;
    profile_public?: boolean;
  };
  userId?: string;
}

function Toggle({ value, onChange, label, desc, icon }: {
  value: boolean; onChange: (v: boolean) => void;
  label: string; desc: string; icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid #eff3f4' }}>
      <div className="flex items-center gap-3">
        <span style={{ color: '#536471' }}>{icon}</span>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#0f1419' }}>{label}</p>
          <p className="text-xs" style={{ color: '#8b98a5' }}>{desc}</p>
        </div>
      </div>
      <button onClick={() => onChange(!value)}
        className="relative w-11 h-6 rounded-full transition-all flex-shrink-0"
        style={{ background: value ? '#ff6b2b' : '#e2e8f0' }}>
        <span className="absolute top-0.5 transition-all rounded-full bg-white w-5 h-5 shadow-sm"
          style={{ left: value ? '22px' : '2px' }} />
      </button>
    </div>
  );
}

export default function ProfileEditModal({ initialData, userId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'profile' | 'privacy'>('profile');
  const [form, setForm] = useState({
    full_name: initialData.full_name || '',
    username: initialData.username || '',
    city: initialData.city || '',
    bio: initialData.bio || '',
  });
  const [privacy, setPrivacy] = useState({
    location_visible: initialData.location_visible !== false,
    show_activity: initialData.show_activity !== false,
    profile_public: initialData.profile_public !== false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const saveProfile = async () => {
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

  const savePrivacy = async (field: string, value: boolean) => {
    setPrivacy((prev) => ({ ...prev, [field]: value }));
    if (userId) {
      const supabase = createClient();
      await supabase.from('profiles').update({ [field]: value }).eq('id', userId);
    }
  };

  const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all";
  const inputStyle = { background: '#f7f8f8', border: '1px solid #eff3f4', color: '#0f1419' };

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
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: '#fff', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #eff3f4' }}>
              <div className="flex items-center gap-4">
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-full hover:bg-gray-100" style={{ color: '#536471' }}>
                  <X size={18} />
                </button>
                <span className="font-black text-base" style={{ color: '#0f1419' }}>
                  {tab === 'profile' ? 'Profili Düzenle' : 'Gizlilik & Güvenlik'}
                </span>
              </div>
              {tab === 'profile' && (
                <button onClick={saveProfile} disabled={loading}
                  className="px-4 py-1.5 rounded-full text-sm font-black text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
                  {loading ? <Loader2 size={14} className="animate-spin" /> : 'Kaydet'}
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex flex-shrink-0" style={{ borderBottom: '1px solid #eff3f4' }}>
              <button onClick={() => setTab('profile')}
                className="flex-1 py-3 text-sm font-bold flex items-center justify-center gap-1.5"
                style={{ color: tab === 'profile' ? '#0f1419' : '#536471', borderBottom: tab === 'profile' ? '2px solid #ff6b2b' : '2px solid transparent' }}>
                <User size={15} /> Profil
              </button>
              <button onClick={() => setTab('privacy')}
                className="flex-1 py-3 text-sm font-bold flex items-center justify-center gap-1.5"
                style={{ color: tab === 'privacy' ? '#0f1419' : '#536471', borderBottom: tab === 'privacy' ? '2px solid #ff6b2b' : '2px solid transparent' }}>
                <Lock size={15} /> Gizlilik
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1">
              {tab === 'profile' ? (
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
                    />
                  </div>
                  {error && <p className="text-sm px-1" style={{ color: '#ef4444' }}>{error}</p>}
                </div>
              ) : (
                <div className="px-4 py-2">
                  <p className="text-xs font-bold mt-3 mb-2 uppercase tracking-wider" style={{ color: '#8b98a5' }}>Görünürlük</p>
                  <Toggle
                    value={privacy.profile_public}
                    onChange={(v) => savePrivacy('profile_public', v)}
                    label="Herkese Açık Profil"
                    desc="Kapalıysa yalnızca arkadaşların profilini görebilir"
                    icon={<Eye size={18} />}
                  />
                  <Toggle
                    value={privacy.location_visible}
                    onChange={(v) => savePrivacy('location_visible', v)}
                    label="Canlı Konum Paylaşımı"
                    desc="Haritada diğer oyuncular seni görebilir"
                    icon={<MapPin size={18} />}
                  />
                  <Toggle
                    value={privacy.show_activity}
                    onChange={(v) => savePrivacy('show_activity', v)}
                    label="Aktivite Durumu"
                    desc="Ne zaman aktif olduğun görünsün"
                    icon={<Bell size={18} />}
                  />
                  <p className="text-xs font-bold mt-4 mb-2 uppercase tracking-wider" style={{ color: '#8b98a5' }}>Mesajlar</p>
                  <Toggle
                    value={true}
                    onChange={() => {}}
                    label="Mesaj Alabilme"
                    desc="Yalnızca arkadaşlarından mesaj al (yakında)"
                    icon={<MessageCircle size={18} />}
                  />
                  <p className="text-xs mt-3 pb-4" style={{ color: '#8b98a5' }}>Bazı ayarlar yakında eklenecek.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
