'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trophy, Loader2, AlertCircle, LogIn, Navigation, CheckCircle, Lock, Clock } from 'lucide-react';
import { Quest } from '@/types';
import { calculateDistance, formatDistance } from '@/lib/distance';
import PhotoUpload from '@/components/PhotoUpload';
import ARTreasure from '@/components/ARTreasure';

interface Step {
  id?: string;
  step_number: number;
  step_type: 'question' | 'location' | 'image' | 'final';
  question?: string | null;
  target_lat: number;
  target_lng: number;
  approach_radius_meters: number;
  hint?: string | null;
}

interface Props {
  quest: Quest;
  alreadyWon: boolean;
  isLoggedIn: boolean;
  steps: Step[];
  initialStep: number;
}

export default function QuestPlay({ quest, alreadyWon, isLoggedIn, steps: rawSteps, initialStep }: Props) {
  const router = useRouter();

  // Adım yoksa görevin kendisinden tek adımlık "final" sentezle
  const hasSteps = rawSteps.length > 0;
  const steps: Step[] = hasSteps ? rawSteps : [{
    step_number: 1,
    step_type: quest.requires_photo_proof ? 'image' : 'final',
    question: null,
    target_lat: quest.latitude,
    target_lng: quest.longitude,
    approach_radius_meters: quest.max_distance_meters,
    hint: quest.hint,
  }];

  const [currentStepNum, setCurrentStepNum] = useState(initialStep);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState('');
  const [answer, setAnswer] = useState('');
  const [photo, setPhoto] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showAR, setShowAR] = useState(false);
  const [done, setDone] = useState<null | { points: number; cash: number; coop: number; pending: boolean }>(null);
  const watchRef = useRef<number | null>(null);

  // Canlı GPS takibi
  useEffect(() => {
    if (!isLoggedIn || alreadyWon) return;
    if (!navigator.geolocation) {
      Promise.resolve().then(() => setGpsError('Cihazın konum desteklemiyor.'));
      return;
    }
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGpsError(''); },
      () => setGpsError('Konum alınamadı — izin vermelisin.'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    return () => { if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current); };
  }, [isLoggedIn, alreadyWon]);

  const step = steps.find((s) => s.step_number === currentStepNum) || steps[0];
  const totalSteps = steps.length;
  const isLastStep = currentStepNum >= totalSteps;

  const liveDistance = coords ? calculateDistance(coords.lat, coords.lng, step.target_lat, step.target_lng) : null;
  const inRange = liveDistance !== null && liveDistance <= step.approach_radius_meters;

  // ---- Görev tamamlama / adım gönderme ----
  const submitStep = async () => {
    if (!coords) { setError('Konum alınamadı.'); return; }
    setError('');
    setSubmitting(true);
    try {
      if (hasSteps) {
        const res = await fetch('/api/quest-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quest_id: quest.id, step_number: currentStepNum,
            answer, latitude: coords.lat, longitude: coords.lng, photo_url: photo || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Hata');
        if (!data.correct) { setError(data.message); setShowAR(false); return false; }
        if (data.is_complete) {
          setDone({ points: data.points ?? quest.points, cash: data.cash_reward ?? 0, coop: data.coop_count ?? 1, pending: false });
        } else {
          setCurrentStepNum(data.next_step);
          setAnswer(''); setPhoto('');
        }
        return true;
      } else {
        const res = await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quest_id: quest.id, latitude: coords.lat, longitude: coords.lng, photo_url: photo || null }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Hata');
        if (!data.isClose) { setError(`Yeterince yakın değilsin (${formatDistance(data.distance)}).`); setShowAR(false); return false; }
        setDone({ points: data.pointsEarned || quest.points, cash: quest.cash_reward || 0, coop: 1, pending: data.status === 'pending' });
        return true;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata oluştu'); setShowAR(false);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // AR sandık açılınca tamamla
  const handleAROpen = async () => {
    const ok = await submitStep();
    if (ok !== false) setShowAR(false);
  };

  // ---- Ekranlar ----
  if (!isLoggedIn) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,107,43,0.12)' }}>
          <LogIn size={26} style={{ color: '#ff6b2b' }} />
        </div>
        <h3 className="text-lg font-black mb-2" style={{ color: '#0f1419' }}>Önce giriş yap</h3>
        <p className="text-sm mb-6" style={{ color: '#536471' }}>Görevi oynamak için ücretsiz hesap aç.</p>
        <div className="flex gap-2">
          <Link href={`/login?next=/quest/${quest.id}`} className="flex-1 font-semibold py-2.5 rounded-xl text-white text-center text-sm" style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>Giriş Yap</Link>
          <Link href="/register" className="flex-1 font-semibold py-2.5 rounded-xl text-sm text-center" style={{ background: '#f7f8f8', color: '#536471', border: '1px solid #eff3f4' }}>Kayıt Ol</Link>
        </div>
      </div>
    );
  }

  if (alreadyWon) {
    return (
      <div className="p-8 text-center">
        <Trophy size={48} className="mx-auto mb-3" style={{ color: '#eab308' }} />
        <h3 className="text-xl font-black mb-2" style={{ color: '#0f1419' }}>Bu görevi tamamladın!</h3>
        <p className="text-sm mb-4" style={{ color: '#536471' }}>Yeni görevlere bak.</p>
        <Link href="/" className="inline-block px-6 py-2.5 rounded-xl font-semibold text-white text-sm" style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>Görev Bul</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="p-8 text-center">
        {done.pending ? (
          <>
            <Clock size={48} className="mx-auto mb-3" style={{ color: '#3b82f6' }} />
            <h3 className="text-xl font-black mb-2" style={{ color: '#0f1419' }}>İncelemeye gönderildi</h3>
            <p className="text-sm mb-4" style={{ color: '#536471' }}>Fotoğrafın onaylanınca puanın eklenecek.</p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h3 className="text-2xl font-black mb-2" style={{ color: '#22c55e' }}>Hazineyi buldun!</h3>
            {done.coop > 1 && <p className="text-sm mb-2" style={{ color: '#536471' }}>{done.coop} kişiyle ortak — ödül eşit bölündü</p>}
            <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(255,107,43,0.08)', border: '1px solid rgba(255,107,43,0.2)' }}>
              <p className="font-black text-3xl" style={{ color: '#0f1419' }}>+{done.points} puan</p>
              {done.cash > 0 && <p className="font-bold text-lg mt-1" style={{ color: '#22c55e' }}>+{done.cash}₺ nakit</p>}
            </div>
          </>
        )}
        <button onClick={() => router.push('/dashboard')} className="px-6 py-2.5 rounded-xl font-semibold text-white text-sm" style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>Ana Sayfaya Dön</button>
      </div>
    );
  }

  // Daralma yüzdesi (radar görseli için)
  const pct = liveDistance !== null ? Math.max(0, Math.min(100, 100 - (liveDistance / Math.max(step.approach_radius_meters * 4, 1)) * 100)) : 0;

  return (
    <>
      {showAR && <ARTreasure onOpen={handleAROpen} onClose={() => setShowAR(false)} />}

      <div className="flex flex-col">
        {/* Adım göstergesi */}
        <div className="p-4 flex items-center gap-2" style={{ borderBottom: '1px solid #eff3f4' }}>
          {steps.map((s) => (
            <div key={s.step_number} className="flex-1 h-1.5 rounded-full"
              style={{ background: s.step_number < currentStepNum ? '#22c55e' : s.step_number === currentStepNum ? '#ff6b2b' : '#eff3f4' }} />
          ))}
        </div>

        <div className="p-4" style={{ borderBottom: '1px solid #eff3f4' }}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-black" style={{ color: '#0f1419' }}>
              {totalSteps > 1 ? `Adım ${currentStepNum}/${totalSteps}` : 'Hazineyi Bul'}
            </h2>
            <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: '#f7f8f8', color: '#536471' }}>
              {step.step_type === 'question' ? '❓ Soru' : step.step_type === 'image' ? '📷 Fotoğraf' : '📍 Konum'}
            </span>
          </div>
          <p className="text-sm" style={{ color: '#536471' }}>
            {inRange ? 'Bölgeye ulaştın! Görevi tamamla.' : 'Canlı konumunla belirtilen bölgeye yaklaş.'}
          </p>
        </div>

        {/* Canlı mesafe radarı */}
        <div className="p-6 flex flex-col items-center" style={{ borderBottom: '1px solid #eff3f4' }}>
          <div className="relative w-44 h-44 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full" style={{ border: '2px dashed #eff3f4' }} />
            <div className="absolute rounded-full transition-all duration-700"
              style={{
                width: `${100 - pct * 0.7}%`, height: `${100 - pct * 0.7}%`,
                background: inRange ? 'rgba(34,197,94,0.15)' : 'rgba(255,107,43,0.1)',
                border: `2px solid ${inRange ? '#22c55e' : '#ff6b2b'}`,
              }} />
            <div className="relative text-center">
              {gpsError ? (
                <div className="px-3"><AlertCircle size={22} className="mx-auto mb-1" style={{ color: '#f87171' }} /><p className="text-[11px]" style={{ color: '#f87171' }}>{gpsError}</p></div>
              ) : liveDistance === null ? (
                <><Loader2 size={22} className="animate-spin mx-auto mb-1" style={{ color: '#536471' }} /><p className="text-xs" style={{ color: '#536471' }}>Konum alınıyor...</p></>
              ) : (
                <>
                  <p className="text-3xl font-black" style={{ color: inRange ? '#22c55e' : '#0f1419' }}>{formatDistance(liveDistance)}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#536471' }}>{inRange ? '✓ Bölgedesin' : 'kaldı'}</p>
                </>
              )}
            </div>
          </div>
          {step.hint && !inRange && (
            <div className="mt-4 rounded-xl px-3 py-2 text-xs w-full" style={{ background: 'rgba(59,130,246,0.06)', color: '#2563eb' }}>
              💡 {step.hint}
            </div>
          )}
        </div>

        {/* Görev alanı — sadece bölgedeyken aktif */}
        <div className="p-4 space-y-3">
          {!inRange ? (
            <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: '#f7f8f8' }}>
              <Lock size={18} style={{ color: '#536471' }} />
              <p className="text-sm" style={{ color: '#536471' }}>Görev, hedef bölgeye girince açılır. Yürümeye devam et.</p>
            </div>
          ) : (
            <>
              {/* Soru */}
              {step.step_type === 'question' && step.question && (
                <div>
                  <p className="font-bold text-sm mb-2" style={{ color: '#0f1419' }}>{step.question}</p>
                  <input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Cevabını yaz..."
                    className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                    style={{ background: '#f7f8f8', border: '1px solid #eff3f4', color: '#0f1419' }} />
                </div>
              )}

              {/* Fotoğraf */}
              {step.step_type === 'image' && (
                <div>
                  <p className="font-bold text-sm mb-2" style={{ color: '#0f1419' }}>Buradan bir fotoğraf çek</p>
                  <PhotoUpload onUpload={setPhoto} />
                </div>
              )}

              {error && (
                <div className="rounded-xl p-3 flex items-start gap-2 text-sm" style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626' }}>
                  <AlertCircle size={15} className="shrink-0 mt-0.5" /><span>{error}</span>
                </div>
              )}

              {/* Aksiyon */}
              {isLastStep ? (
                <button
                  onClick={() => {
                    if (step.step_type === 'question' && !answer.trim()) { setError('Önce soruyu cevapla.'); return; }
                    if (step.step_type === 'image' && !photo) { setError('Önce fotoğraf çek.'); return; }
                    setError(''); setShowAR(true);
                  }}
                  disabled={submitting}
                  className="w-full font-black py-3.5 rounded-xl flex items-center justify-center gap-2 text-white"
                  style={{ background: 'linear-gradient(135deg,#ffd700,#ff6b2b)', boxShadow: '0 6px 20px rgba(255,107,43,0.4)' }}>
                  ✨ Kamerayı Aç — Hazineyi Bul
                </button>
              ) : (
                <button onClick={submitStep} disabled={submitting || (step.step_type === 'question' && !answer.trim()) || (step.step_type === 'image' && !photo)}
                  className="w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
                  {submitting ? <><Loader2 size={16} className="animate-spin" /> Kontrol ediliyor...</> : <><CheckCircle size={16} /> Bu Adımı Tamamla</>}
                </button>
              )}
            </>
          )}

          <p className="text-center text-xs flex items-center justify-center gap-1" style={{ color: '#8e8e8e' }}>
            <Navigation size={11} /> Konumun canlı takip ediliyor
          </p>
        </div>
      </div>
    </>
  );
}
