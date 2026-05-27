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

  // Giriş yapmadıysa
  if (authChecked && !user) {
    return (
      <div className="p-8 text-center">
        <div className="bg-orange-100 text-orange-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <LogIn size={28} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Önce giriş yap</h3>
        <p className="text-gray-500 text-sm mb-6">
          Görevi çözebilmek için ücretsiz bir hesap aç.
        </p>
        <div className="flex gap-2">
          <Link
            href={`/login?next=/quest/${quest.id}`}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 rounded-xl transition-colors"
          >
            Giriş Yap
          </Link>
          <Link
            href="/register"
            className="flex-1 border border-gray-200 hover:border-orange-300 text-gray-700 font-medium py-2.5 rounded-xl transition-colors"
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
        <Trophy size={48} className="mx-auto mb-3 text-yellow-400" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Bu görev tamamlandı!</h3>
        <p className="text-gray-500 text-sm">Yeni görevlere bak.</p>
        <Link
          href="/"
          className="inline-block mt-4 bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2.5 rounded-xl transition-colors"
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
          <h3 className="text-2xl font-extrabold text-green-600 mb-2">Tebrikler, buldun!</h3>
          <p className="text-gray-600 mb-4">
            Konuma sadece <strong>{formatDistance(result.distance)}</strong> uzaktaydın.
          </p>
          <div className="bg-orange-50 rounded-2xl p-4 mb-4">
            <p className="text-orange-600 font-semibold text-sm mb-1">Kazandın</p>
            <p className="text-orange-800 font-bold text-2xl">+{result.pointsEarned} puan</p>
          </div>
          <button
            onClick={() => router.push('/profile')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2.5 rounded-xl transition-colors"
          >
            Profilime Git
          </button>
        </div>
      );
    }

    if (result.status === 'pending') {
      return (
        <div className="p-8 text-center">
          <Clock size={48} className="mx-auto mb-3 text-blue-500" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">İncelemeye gönderildi</h3>
          <p className="text-gray-500 mb-4">
            Doğru konumdaydın ({formatDistance(result.distance)}). Fotoğrafın onaylanırsa
            puanın hesabına eklenecek.
          </p>
          <Link
            href="/"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2.5 rounded-xl transition-colors"
          >
            Diğer Görevler
          </Link>
        </div>
      );
    }

    return (
      <div className="p-8 text-center">
        <div className="text-5xl mb-4">📍</div>
        <h3 className="text-xl font-bold text-gray-700 mb-2">Yeterince yakın değildin</h3>
        <p className="text-gray-500 mb-4">
          Konuma <strong className="text-red-500">{formatDistance(result.distance)}</strong> uzaktaydın.
          Maksimum: {formatDistance(quest.max_distance_meters)}.
        </p>
        <button
          onClick={() => { setResult(null); setLat(null); setLng(null); setProofPhoto(''); }}
          className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2.5 rounded-xl transition-colors"
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
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-100">
        <h2 className="font-bold text-gray-900 mb-1">Konumu Belirle</h2>
        <p className="text-gray-500 text-sm">
          GPS&apos;ini aç veya haritadan pin bırak.
        </p>
      </div>

      {/* GPS butonu */}
      <div className="p-4 border-b border-gray-100">
        <button
          onClick={handleUseGps}
          disabled={gpsLoading}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          {gpsLoading ? (
            <><Loader2 size={16} className="animate-spin" /> Konum alınıyor...</>
          ) : (
            <><Navigation size={16} /> Mevcut Konumumu Kullan</>
          )}
        </button>
        {useGps && lat && (
          <p className="flex items-center gap-1.5 text-green-600 text-xs mt-2">
            <MapPin size={11} /> GPS konumu alındı
          </p>
        )}
      </div>

      <div className="h-64 border-b border-gray-100">
        <MapPicker
          onLocationSelect={(la, ln) => { setLat(la); setLng(ln); setUseGps(false); }}
          initialLat={lat || undefined}
          initialLng={lng || undefined}
        />
      </div>

      {/* Fotoğraf kanıtı */}
      {quest.requires_photo_proof && (
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Camera size={16} className="text-gray-600" />
            <h3 className="font-bold text-gray-900 text-sm">Konum Fotoğrafı</h3>
            <span className="text-red-500 text-xs">*</span>
          </div>
          <p className="text-gray-500 text-xs mb-3">
            Konuma vardığını kanıtlamak için orada çekilmiş bir fotoğraf yükle.
          </p>
          <PhotoUpload onUpload={setProofPhoto} />
        </div>
      )}

      <div className="p-4 space-y-3">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-red-700 text-sm">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !lat}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Kontrol ediliyor...</>
          ) : (
            <><Send size={16} /> Tahmini Gönder</>
          )}
        </button>

        <p className="text-gray-400 text-xs text-center">
          Konuma {formatDistance(quest.max_distance_meters)} içinde olman gerekiyor.
        </p>
      </div>
    </div>
  );
}
