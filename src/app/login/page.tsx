'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Loader2, Mail, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0a0f' }}>
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="rounded-2xl p-2.5 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}>
            <MapPin size={24} className="text-white" />
          </div>
          <span className="text-2xl font-black" style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff8c5a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            İzi Bul
          </span>
        </Link>

        <div className="rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h1 className="text-2xl font-black text-white mb-1">Tekrar hoş geldin!</h1>
          <p className="text-white/40 text-sm mb-6">Hesabına giriş yap, keşfe devam et.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-white/60 text-sm font-medium block mb-1.5">E-posta</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3.5 text-white/20" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  placeholder="ornek@email.com"
                  onFocus={(e) => e.target.style.borderColor = 'rgba(255,107,43,0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
              </div>
            </div>

            <div>
              <label className="text-white/60 text-sm font-medium block mb-1.5">Şifre</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3.5 text-white/20" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  placeholder="••••••••"
                  onFocus={(e) => e.target.style.borderColor = 'rgba(255,107,43,0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl p-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-white"
              style={{ background: loading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Giriş yapılıyor...</> : 'Giriş Yap'}
            </button>
          </form>

          <p className="text-center text-sm text-white/30 mt-6">
            Hesabın yok mu?{' '}
            <Link href="/register" className="font-semibold" style={{ color: '#ff6b2b' }}>
              Kayıt ol
            </Link>
          </p>
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
