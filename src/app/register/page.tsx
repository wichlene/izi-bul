'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Loader2, Mail, Lock, User, AtSign, Phone } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [refCode] = useState(() => searchParams.get('ref') || '');
  const [form, setForm] = useState({ email: '', password: '', username: '', full_name: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const normalizePhone = (v: string) => {
    const digits = v.replace(/\D/g, '');
    if (digits.startsWith('90') && digits.length === 12) return '0' + digits.slice(2);
    return digits;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) { setError('Şifre en az 6 karakter olmalı'); return; }
    if (form.username.length < 3) { setError('Kullanıcı adı en az 3 karakter olmalı'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) { setError('Kullanıcı adı sadece harf, rakam ve _ içerebilir'); return; }

    const phone = form.phone ? normalizePhone(form.phone) : '';
    if (phone && !/^05\d{9}$/.test(phone)) { setError('Geçerli bir Türkiye telefon numarası gir (05xx...)'); return; }

    setLoading(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          username: form.username.toLowerCase(),
          full_name: form.full_name,
          ...(phone && { phone }),
          ...(refCode && { referred_by: refCode }),
        },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message === 'User already registered' ? 'Bu e-posta zaten kayıtlı' : signUpError.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      setLoading(false);
      setSuccess(true);
      return;
    }

    await Promise.all([
      phone ? fetch('/api/profile/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      }) : Promise.resolve(),
      refCode ? fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref_code: refCode }),
      }) : Promise.resolve(),
    ]);

    router.push('/dashboard');
    router.refresh();
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
  };

  const fields = [
    { label: 'Adın Soyadın', icon: <User size={16} />, key: 'full_name', type: 'text', placeholder: 'Ahmet Yılmaz' },
    { label: 'Kullanıcı Adı', icon: <AtSign size={16} />, key: 'username', type: 'text', placeholder: 'ahmetylmz' },
    { label: 'E-posta', icon: <Mail size={16} />, key: 'email', type: 'email', placeholder: 'ornek@email.com' },
    { label: 'Telefon (isteğe bağlı)', icon: <Phone size={16} />, key: 'phone', type: 'tel', placeholder: '05xx xxx xx xx' },
    { label: 'Şifre', icon: <Lock size={16} />, key: 'password', type: 'password', placeholder: 'En az 6 karakter' },
  ];

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: '#0a0a0f' }}>
        <div className="w-full max-w-md text-center">
          <div className="rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="mx-auto mb-5 w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}>
              <Mail size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">E-postanı kontrol et</h1>
            <p className="text-white/50 text-sm mb-6">
              <span className="text-white/80 font-semibold">{form.email}</span> adresine bir onay bağlantısı gönderdik.
              Hesabını aktifleştirmek için maildeki bağlantıya tıkla.
            </p>
            <Link href="/login" className="inline-block w-full font-bold py-3 rounded-xl text-white" style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}>
              Giriş ekranına dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: '#0a0a0f' }}>
      <div className="w-full max-w-md">
        <Link href="/login" className="flex items-center justify-center gap-2 mb-8">
          <div className="rounded-2xl p-2.5" style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}>
            <MapPin size={24} className="text-white" />
          </div>
          <span className="text-2xl font-black" style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff8c5a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            İzi Bul
          </span>
        </Link>

        <div className="rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {refCode && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <span className="text-lg">🎁</span>
              <p className="text-sm font-bold" style={{ color: '#22c55e' }}>Davet bonusu aktif — kayıt olunca +50 puan kazanırsın!</p>
            </div>
          )}
          <h1 className="text-2xl font-black text-white mb-1">Maceraya başla!</h1>
          <p className="text-white/40 text-sm mb-6">Ücretsiz hesap aç, keşfe çık, ödülleri topla.</p>

          <form onSubmit={handleRegister} className="space-y-3">
            {fields.map(({ label, icon, key, type, placeholder }) => (
              <div key={key}>
                <label className="text-white/60 text-sm font-medium block mb-1.5">{label}</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-white/20">{icon}</span>
                  <input
                    type={type}
                    required={key !== 'phone'}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition-all"
                    style={inputStyle}
                    placeholder={placeholder}
                    onFocus={(e) => (e.target.style.borderColor = 'rgba(255,107,43,0.5)')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
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

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: '#ff6b2b' }} />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
