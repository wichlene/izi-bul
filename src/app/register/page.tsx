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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="bg-orange-500 text-white rounded-2xl p-2.5">
            <MapPin size={24} />
          </div>
          <span className="text-2xl font-bold text-gray-900">İzi Bul</span>
        </Link>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Maceraya başla!</h1>
          <p className="text-gray-500 mb-6">Ücretsiz hesap aç, keşfe çık, ödülleri topla.</p>

          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Adın Soyadın</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Ahmet Yılmaz"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Kullanıcı Adı</label>
              <div className="relative">
                <AtSign size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="ahmetylmz"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">E-posta</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="En az 6 karakter"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Kayıt yapılıyor...</> : 'Hesabımı Oluştur'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Zaten hesabın var mı?{' '}
            <Link href="/login" className="text-orange-500 font-semibold hover:text-orange-600">
              Giriş yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
