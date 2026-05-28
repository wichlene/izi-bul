'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Loader2, Mail, Lock, User, AtSign } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', username: '', full_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) { setError('Şifre en az 6 karakter olmalı'); return; }
    if (form.username.length < 3) { setError('Kullanıcı adı en az 3 karakter olmalı'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) { setError('Kullanıcı adı sadece harf, rakam ve _ içerebilir'); return; }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { username: form.username.toLowerCase(), full_name: form.full_name },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: '#0a0a0f' }}>
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="rounded-2xl p-2.5" style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}>
            <MapPin size={24} className="text-white" />
          </div>
          <span className="text-2xl font-black" style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff8c5a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            İzi Bul
          </span>
        </Link>

        <div className="rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h1 className="text-2xl font-black text-white mb-1">Maceraya başla!</h1>
          <p className="text-white/40 text-sm mb-6">Ücretsiz hesap aç, keşfe çık, ödülleri topla.</p>

          <form onSubmit={handleRegister} className="space-y-3">
            {[
              { label: 'Adın Soyadın', icon: <User size={16} />, key: 'full_name', type: 'text', placeholder: 'Ahmet Yılmaz' },
              { label: 'Kullanıcı Adı', icon: <AtSign size={16} />, key: 'username', type: 'text', placeholder: 'ahmetylmz' },
              { label: 'E-posta', icon: <Mail size={16} />, key: 'email', type: 'email', placeholder: 'ornek@email.com' },
              { label: 'Şifre', icon: <Lock size={16} />, key: 'password', type: 'password', placeholder: 'En az 6 karakter' },
            ].map(({ label, icon, key, type, placeholder }) => (
              <div key={key}>
                <label className="text-white/60 text-sm font-medium block mb-1.5">{label}</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-white/20">{icon}</span>
                  <input
                    type={type}
                    required
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition-all"
                    style={inputStyle}
                    placeholder={placeholder}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(255,107,43,0.5)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                </div>
              </div>
            ))}

            {error && (
              <div className="rounded-xl p-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-white mt-2"
              style={{ background: loading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Kayıt yapılıyor...</> : 'Hesabımı Oluştur'}
            </button>
          </form>

          <p className="text-center text-sm text-white/30 mt-6">
            Zaten hesabın var mı?{' '}
            <Link href="/login" className="font-semibold" style={{ color: '#ff6b2b' }}>
              Giriş yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
