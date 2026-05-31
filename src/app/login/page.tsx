'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Loader2, Mail, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/dashboard';
  const urlError = params.get('error');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(
    urlError === 'link_expired' ? 'Şifre sıfırlama linki süresi dolmuş. Tekrar dene.' :
    urlError === 'missing_token' ? 'Geçersiz link. Tekrar şifre sıfırlama isteği gönder.' : ''
  );
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'E-posta veya şifre yanlış' : error.message);
      setLoading(false);
    } else {
      router.push(next);
      router.refresh();
    }
  };

  const inputBase = { background: '#f7f8f8', border: '1px solid #eff3f4', color: '#0f1419' };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f7f8f8' }}>
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="rounded-2xl p-2.5 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}>
            <MapPin size={24} className="text-white" />
          </div>
          <span className="text-2xl font-black" style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            İzi Bul
          </span>
        </Link>

        <div className="rounded-3xl p-8" style={{ background: '#fff', border: '1px solid #eff3f4' }}>
          <h1 className="text-2xl font-black mb-1" style={{ color: '#0f1419' }}>Tekrar hoş geldin!</h1>
          <p className="text-sm mb-6" style={{ color: '#536471' }}>Hesabına giriş yap, keşfe devam et.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: '#536471' }}>E-posta</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3.5" style={{ color: '#c4c9d0' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-all"
                  style={inputBase}
                  placeholder="ornek@email.com"
                  onFocus={(e) => e.target.style.borderColor = '#ff6b2b'}
                  onBlur={(e) => e.target.style.borderColor = '#eff3f4'}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: '#536471' }}>Şifre</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3.5" style={{ color: '#c4c9d0' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-all"
                  style={inputBase}
                  placeholder="••••••••"
                  onFocus={(e) => e.target.style.borderColor = '#ff6b2b'}
                  onBlur={(e) => e.target.style.borderColor = '#eff3f4'}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl p-3 text-sm" style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-white"
              style={{ background: loading ? '#e5e7eb' : 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}
            >
              {loading ? <><Loader2 size={16} className="animate-spin" style={{ color: '#536471' }} /><span style={{ color: '#536471' }}>Giriş yapılıyor...</span></> : 'Giriş Yap'}
            </button>
          </form>

          <div className="mt-6 space-y-3 text-center text-sm">
            <div>
              <Link href="/forgot-password" className="transition-colors" style={{ color: '#8e9aab' }}>
                Şifremi Unuttum
              </Link>
            </div>
            <p style={{ color: '#8e9aab' }}>
              Hesabın yok mu?{' '}
              <Link href="/register" className="font-semibold" style={{ color: '#ff6b2b' }}>
                Kayıt ol
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
