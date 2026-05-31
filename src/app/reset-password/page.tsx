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
      setTimeout(() => router.push('/dashboard'), 2000);
    }
  };

  const inputBase = { background: '#f7f8f8', border: '1px solid #eff3f4', color: '#0f1419' };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f7f8f8' }}>
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="rounded-2xl p-2.5" style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}>
            <MapPin size={24} className="text-white" />
          </div>
          <span className="text-2xl font-black" style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            İzi Bul
          </span>
        </Link>

        <div className="rounded-3xl p-8" style={{ background: '#fff', border: '1px solid #eff3f4' }}>
          {done ? (
            <div className="text-center">
              <div className="text-5xl mb-4">✅</div>
              <h1 className="text-xl font-black mb-2" style={{ color: '#0f1419' }}>Şifre güncellendi!</h1>
              <p className="text-sm" style={{ color: '#536471' }}>Ana sayfaya yönlendiriliyorsun...</p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-black mb-1" style={{ color: '#0f1419' }}>Yeni Şifre Belirle</h1>
              <p className="text-sm mb-6" style={{ color: '#536471' }}>En az 6 karakter olsun.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: '#536471' }}>Yeni Şifre</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-3.5" style={{ color: '#c4c9d0' }} />
                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-all"
                      style={inputBase} placeholder="••••••••"
                      onFocus={(e) => e.target.style.borderColor = '#ff6b2b'}
                      onBlur={(e) => e.target.style.borderColor = '#eff3f4'} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: '#536471' }}>Şifre Tekrar</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-3.5" style={{ color: '#c4c9d0' }} />
                    <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
                      className="w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-all"
                      style={inputBase} placeholder="••••••••"
                      onFocus={(e) => e.target.style.borderColor = '#ff6b2b'}
                      onBlur={(e) => e.target.style.borderColor = '#eff3f4'} />
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl p-3 text-sm" style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-white transition-all"
                  style={{ background: loading ? '#e5e7eb' : 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}>
                  {loading ? <><Loader2 size={16} className="animate-spin" style={{ color: '#536471' }} /><span style={{ color: '#536471' }}>Güncelleniyor...</span></> : 'Şifreyi Güncelle'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
