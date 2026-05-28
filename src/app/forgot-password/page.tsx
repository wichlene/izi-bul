'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Mail, Loader2, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    if (error) {
      setError('Mail gönderilemedi. E-posta adresini kontrol et.');
      setLoading(false);
    } else {
      setSent(true);
    }
  };

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
          {sent ? (
            <div className="text-center">
              <div className="text-5xl mb-4">📧</div>
              <h1 className="text-xl font-black text-white mb-2">Mail gönderildi!</h1>
              <p className="text-white/40 text-sm mb-6">
                <span className="text-white/60">{email}</span> adresine şifre sıfırlama linki gönderdik. Spam klasörünü de kontrol et.
              </p>
              <Link href="/login" className="text-sm font-semibold" style={{ color: '#ff6b2b' }}>
                Giriş sayfasına dön →
              </Link>
            </div>
          ) : (
            <>
              <Link href="/login" className="inline-flex items-center gap-1.5 text-white/30 hover:text-white/60 text-sm mb-5 transition-colors">
                <ArrowLeft size={14} /> Geri
              </Link>
              <h1 className="text-2xl font-black text-white mb-1">Şifremi Unuttum</h1>
              <p className="text-white/40 text-sm mb-6">E-posta adresini gir, sıfırlama linki gönderelim.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
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

                {error && (
                  <div className="rounded-xl p-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-white transition-all"
                  style={{ background: loading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Gönderiliyor...</> : 'Link Gönder'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
