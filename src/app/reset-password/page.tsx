'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Lock, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Şifreler eşleşmiyor'); return; }
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalı'); return; }
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError('Şifre güncellenemedi. Linkin süresi geçmiş olabilir.');
      setLoading(false);
    } else {
      setDone(true);
      setTimeout(() => router.push('/'), 2000);
    }
  };

  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0a0f' }}>
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
          {done ? (
            <div className="text-center">
              <div className="text-5xl mb-4">✅</div>
              <h1 className="text-xl font-black text-white mb-2">Şifre güncellendi!</h1>
              <p className="text-white/40 text-sm">Ana sayfaya yönlendiriliyorsun...</p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-black text-white mb-1">Yeni Şifre Belirle</h1>
              <p className="text-white/40 text-sm mb-6">En az 6 karakter olsun.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm font-medium block mb-1.5">Yeni Şifre</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-3.5 text-white/20" />
                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition-all"
                      style={inputStyle} placeholder="••••••••"
                      onFocus={(e) => e.target.style.borderColor = 'rgba(255,107,43,0.5)'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                  </div>
                </div>
                <div>
                  <label className="text-white/60 text-sm font-medium block mb-1.5">Şifre Tekrar</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-3.5 text-white/20" />
                    <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
                      className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition-all"
                      style={inputStyle} placeholder="••••••••"
                      onFocus={(e) => e.target.style.borderColor = 'rgba(255,107,43,0.5)'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl p-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-white transition-all"
                  style={{ background: loading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}>
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Güncelleniyor...</> : 'Şifreyi Güncelle'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
