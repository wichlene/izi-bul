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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="bg-orange-500 text-white rounded-2xl p-2.5">
            <MapPin size={24} />
          </div>
          <span className="text-2xl font-bold text-gray-900">İzi Bul</span>
        </Link>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Tekrar hoş geldin!</h1>
          <p className="text-gray-500 mb-6">Hesabına giriş yap, keşfe devam et.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">E-posta</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="ornek@email.com"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Şifre</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Giriş yapılıyor...</> : 'Giriş Yap'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Hesabın yok mu?{' '}
            <Link href="/register" className="text-orange-500 font-semibold hover:text-orange-600">
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
