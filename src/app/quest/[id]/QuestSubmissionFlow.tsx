'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Send, Trophy, MapPin, Loader2, Camera, Navigation, AlertCircle, Clock, LogIn } from 'lucide-react';
import { Quest } from '@/types';
import { formatDistance } from '@/lib/distance';
import { createClient } from '@/lib/supabase/client';
import PhotoUpload from '@/components/PhotoUpload';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

interface Props {
  quest: Quest;
  alreadyWon: boolean;
}

interface SubmissionResult {
  distance: number;
  isClose: boolean;
  status: string;
  isWinner: boolean;
  pointsEarned: number;
  photoRequired: boolean;
}

export default function QuestSubmissionFlow({ quest, alreadyWon }: Props) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [proofPhoto, setProofPhoto] = useState('');
  const [useGps, setUseGps] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SubmissionResult | null>(null);

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthChecked(true);
    };
    check();
  }, []);

  if (authChecked && !user) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,107,43,0.15)' }}>
          <LogIn size={26} style={{ color: '#ff6b2b' }} />
        </div>
        <h3 className="text-lg font-black text-white mb-2">Önce giriş yap</h3>
        <p className="text-white/40 text-sm mb-6">Görevi çözebilmek için ücretsiz bir hesap aç.</p>
        <div className="flex gap-2">
          <Link
            href={`/login?next=/quest/${quest.id}`}
            className="flex-1 font-semibold py-2.5 rounded-xl transition-all text-white text-center text-sm"
            style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}
          >
            Giriş Yap
          </Link>
          <Link
            href="/register"
            className="flex-1 font-semibold py-2.5 rounded-xl transition-all text-sm text-center"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Kayıt Ol
          </Link>
        </div>
      </div>
    );
  }

  if (alreadyWon) {
    return (
      <div className="p-8 text-center">
        <Trophy size={48} className="mx-auto mb-3" style={{ color: '#eab308' }} />
        <h3 className="text-xl font-black text-white mb-2">Bu görev tamamlandı!</h3>
        <p className="text-white/40 text-sm">Yeni görevlere bak.</p>
        <Link
          href="/"
          className="inline-block mt-4 px-6 py-2.5 rounded-xl font-semibold text-white text-sm"
          style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}
        >
          Görev Bul
        </Link>
      </div>
    );
  }

  if (result) {
    if (result.isWinner) {
      return (
        <div className="p-8 text-center">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h3 className="text-2xl font-black mb-2" style={{ color: '#22c55e' }}>Tebrikler, buldun!</h3>
          <p className="text-white/50 mb-4">
            Konuma sadece <strong className="text-white">{formatDistance(result.distance)}</strong> uzaktaydın.
          </p>
          <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(255,107,43,0.1)', border: '1px solid rgba(255,107,43,0.2)' }}>
            <p className="text-sm mb-1" style={{ color: '#ff6b2b' }}>Kazandın</p>
            <p className="font-black text-3xl text-white">+{result.pointsEarned} puan</p>
          </div>
          <button
            onClick={() => router.push('/profile')}
            className="px-6 py-2.5 rounded-xl font-semibold text-white text-sm"
            style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}
          >
            Profilime Git
          </button>
        </div>
      );
    }

    if (result.status === 'pending') {
      return (
        <div className="p-8 text-center">
          <Clock size={48} className="mx-auto mb-3" style={{ color: '#3b82f6' }} />
          <h3 className="text-xl font-black text-white mb-2">İncelemeye gönderildi</h3>
          <p className="text-white/40 text-sm mb-4">
            Doğru konumdaydın ({formatDistance(result.distance)}). Fotoğrafın onaylanırsa
            puanın hesabına eklenecek.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-2.5 rounded-xl font-semibold text-white text-sm"
            style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}
          >
            Diğer Görevler
          </Link>
        </div>
      );
    }

    return (
      <div className="p-8 text-center">
        <div className="text-5xl mb-4">📍</div>
        <h3 className="text-xl font-black text-white/70 mb-2">Yeterince yakın değildin</h3>
        <p className="text-white/40 text-sm mb-4">
          Konuma <strong style={{ color: '#f87171' }}>{formatDistance(result.distance)}</strong> uzaktaydın.
          Maksimum: {formatDistance(quest.max_distance_meters)}.
        </p>
        <button
          onClick={() => { setResult(null); setLat(null); setLng(null); setProofPhoto(''); }}
          className="px-6 py-2.5 rounded-xl font-semibold text-white text-sm"
          style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  const handleUseGps = () => {
    setGpsLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setUseGps(true);
        setGpsLoading(false);
      },
      (err) => {
        setError('Konum alınamadı: ' + err.message);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async () => {
    if (!lat || !lng) { setError('Önce konumu seç!'); return; }
    if (quest.requires_photo_proof && !proofPhoto) {
      setError('Konumdaki fotoğraf zorunlu (doğrulama için).');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quest_id: quest.id,
          latitude: lat,
          longitude: lng,
          photo_url: proofPhoto || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-white/20" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 className="font-black text-white mb-0.5">Konumu Belirle</h2>
        <p className="text-white/30 text-sm">GPS&apos;ini aç veya haritadan pin bırak.</p>
      </div>

      <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={handleUseGps}
          disabled={gpsLoading}
          className="w-full font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-white text-sm"
          style={{ background: gpsLoading ? 'rgba(255,255,255,0.05)' : 'rgba(59,130,246,0.2)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}
        >
          {gpsLoading ? (
            <><Loader2 size={15} className="animate-spin" /> Konum alınıyor...</>
          ) : (
            <><Navigation size={15} /> Mevcut Konumumu Kullan</>
          )}
        </button>
        {useGps && lat && (
          <p className="flex items-center gap-1.5 text-xs mt-2" style={{ color: '#22c55e' }}>
            <MapPin size={11} /> GPS konumu alındı
          </p>
        )}
      </div>

      <div className="h-64" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <MapPicker
          onLocationSelect={(la, ln) => { setLat(la); setLng(ln); setUseGps(false); }}
          initialLat={lat || undefined}
          initialLng={lng || undefined}
        />
      </div>

      {quest.requires_photo_proof && (
        <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Camera size={15} className="text-white/40" />
            <h3 className="font-bold text-white text-sm">Konum Fotoğrafı</h3>
            <span className="text-xs" style={{ color: '#f87171' }}>*</span>
          </div>
          <p className="text-white/30 text-xs mb-3">Konuma vardığını kanıtlamak için orada çekilmiş bir fotoğraf yükle.</p>
          <PhotoUpload onUpload={setProofPhoto} />
        </div>
      )}

      <div className="p-4 space-y-3">
        {error && (
          <div className="rounded-xl p-3 flex items-start gap-2 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !lat}
          className="w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-white"
          style={{ background: (loading || !lat) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #ff6b2b, #ff3d00)', color: (loading || !lat) ? 'rgba(255,255,255,0.2)' : 'white' }}
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Kontrol ediliyor...</>
          ) : (
            <><Send size={15} /> Tahmini Gönder</>
          )}
        </button>

        <p className="text-white/20 text-xs text-center">
          Konuma {formatDistance(quest.max_distance_meters)} içinde olman gerekiyor.
        </p>
      </div>
    </div>
  );
}
