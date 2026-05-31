'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trophy, Loader2, AlertCircle, LogIn, Navigation, CheckCircle, Lock, Clock, ScanLine, Map } from 'lucide-react';
import { playQuestComplete, playError } from '@/lib/sounds';
import { Quest } from '@/types';
import { calculateDistance, formatDistance } from '@/lib/distance';
import PhotoUpload from '@/components/PhotoUpload';
import ARTreasure from '@/components/ARTreasure';

const QuestMap = dynamic(() => import('@/components/QuestMap'), { ssr: false });

interface Step {
  id?: string;
  step_number: number;
  step_type: string;
  has_question?: boolean;
  has_image?: boolean;
  question?: string | null;
  photo_url?: string | null;
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
    has_question: false,
    has_image: quest.requires_photo_proof,
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
  const [showMap, setShowMap] = useState(false);
  const [started, setStarted] = useState(initialStep > 1);
  const [done, setDone] = useState<null | { points: number; cash: number; coop: number; pending: boolean }>(null);
  const [blocked, setBlocked] = useState<null | { message: string; questId: string }>(null);
  const [abandoning, setAbandoning] = useState(false);
  const [aiResult, setAiResult] = useState<null | { match: number; accepted: boolean; reasoning: string }>(null);
  const [aiLoading, setAiLoading] = useState(false);
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
        // Başka aktif görev varsa engellendi
        if (res.status === 409 && data.blocked) {
          setBlocked({ message: data.message, questId: data.active_quest_id });
          setShowAR(false);
          return false;
        }
        if (!res.ok) throw new Error(data.error || 'Hata');
        if (!data.correct) { setError(data.message); setShowAR(false); return false; }
        if (data.is_complete) {
          playQuestComplete();
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
        if (!data.isClose) { playError(); setError(`Yeterince yakın değilsin (${formatDistance(data.distance)}).`); setShowAR(false); return false; }
        playQuestComplete();
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

  // Diğer aktif görevi bırak
  const abandonOther = async () => {
    if (!blocked) return;
    setAbandoning(true);
    await fetch(`/api/quest-progress?quest_id=${blocked.questId}`, { method: 'DELETE' });
    setAbandoning(false);
    setBlocked(null);
    // Bırakıldı, şimdi bu göreve devam edebilir — adımı tekrar dene
    submitStep();
  };

  // ---- Quest kapandı — başka biri kazandı ----
  if (!quest.is_active && !alreadyWon) {
    return (
      <div className="p-8 text-center">
        <div className="text-4xl mb-3">🏁</div>
        <h3 className="text-lg font-black mb-2" style={{ color: '#0f1419' }}>Görev kapandı</h3>
        <p className="text-sm mb-4" style={{ color: '#536471' }}>Bu görevi başka bir oyuncu tamamladı. Yeni görevlere bak!</p>
        <Link href="/dashboard" className="inline-block px-6 py-2.5 rounded-xl font-semibold text-white text-sm" style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>Yeni Görev Bul</Link>
      </div>
    );
  }

  // ---- Başlangıç: harita ile kabul ekranı ----
  if (!started && isLoggedIn && !alreadyWon) {
    return (
      <div className="flex flex-col">
        <div className="p-4" style={{ borderBottom: '1px solid #eff3f4' }}>
          <h2 className="font-black text-base" style={{ color: '#0f1419' }}>Hazır mısın?</h2>
          <p className="text-sm mt-0.5" style={{ color: '#536471' }}>Görev alanı haritada gösteriliyor. Yaklaş ve görevi tamamla.</p>
        </div>
        <div style={{ height: 280, position: 'relative' }}>
          <QuestMap
            userLat={coords?.lat ?? null}
            userLng={coords?.lng ?? null}
            targetLat={step.target_lat}
            targetLng={step.target_lng}
            radiusMeters={step.approach_radius_meters}
            inRange={inRange}
          />
          {coords && inRange && (
            <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: 'rgba(34,197,94,0.9)', color: '#fff' }}>
              ✓ Bölgedesin!
            </div>
          )}
          {coords && !inRange && liveDistance !== null && (
            <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}>
              {formatDistance(liveDistance)} uzakta
            </div>
          )}
        </div>
        <div className="p-4 space-y-2">
          {gpsError && (
            <div className="rounded-xl p-3 flex items-start gap-2 text-sm" style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626' }}>
              <AlertCircle size={15} className="shrink-0 mt-0.5" />{gpsError}
            </div>
          )}
          <button
            onClick={() => setStarted(true)}
            className="w-full font-black py-3.5 rounded-xl text-white flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)', boxShadow: '0 6px 20px rgba(255,107,43,0.35)' }}
          >
            🚀 Görevi Başlat
          </button>
        </div>
      </div>
    );
  }

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

  if (blocked) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(234,179,8,0.12)' }}>
          <Lock size={26} style={{ color: '#eab308' }} />
        </div>
        <h3 className="text-lg font-black mb-2" style={{ color: '#0f1419' }}>Önce mevcut görevini bitir</h3>
        <p className="text-sm mb-6" style={{ color: '#536471' }}>{blocked.message}</p>
        <div className="flex flex-col gap-2">
          <Link href={`/quest/${blocked.questId}`}
            className="font-semibold py-2.5 rounded-xl text-white text-center text-sm"
            style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
            Mevcut göreve devam et
          </Link>
          <button onClick={abandonOther} disabled={abandoning}
            className="font-semibold py-2.5 rounded-xl text-sm disabled:opacity-60"
            style={{ background: '#fef2f2', color: '#ef4444' }}>
            {abandoning ? 'Bırakılıyor...' : 'Diğer görevi bırak, buna başla'}
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    const shareWin = async () => {
      const text = done.pending
        ? `İzi Bul'da "${quest.title}" görevini tamamladım, onay bekliyorum! Sen de dene: https://izibul.com/quest/${quest.id}`
        : `İzi Bul'da "${quest.title}" hazinesini buldum 🎯 +${done.points} puan kazandım! Sen de bulabilir misin? 👉 https://izibul.com/quest/${quest.id}`;
      if (navigator.share) {
        await navigator.share({ title: 'İzi Bul — Hazineyi buldum!', text, url: `https://izibul.com/quest/${quest.id}` }).catch(() => null);
      } else {
        await navigator.clipboard.writeText(text).catch(() => null);
        alert('Link kopyalandı!');
      }
    };

    return (
      <div className="flex flex-col items-center p-6">
        {done.pending ? (
          <div className="w-full max-w-sm text-center">
            <Clock size={56} className="mx-auto mb-4" style={{ color: '#3b82f6' }} />
            <h3 className="text-xl font-black mb-2" style={{ color: '#0f1419' }}>İncelemeye gönderildi</h3>
            <p className="text-sm mb-6" style={{ color: '#536471' }}>Fotoğrafın onaylanınca puanın eklenecek.</p>
          </div>
        ) : (
          /* Paylaşılabilir kazanma kartı */
          <div className="w-full max-w-sm rounded-3xl overflow-hidden mb-5" style={{ background: 'linear-gradient(135deg,#0f1419 0%,#1a2332 100%)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            {/* Görev fotoğrafı */}
            {quest.photo_url && (
              <div className="relative h-40 overflow-hidden">
                <img src={quest.photo_url} alt={quest.title} className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 20%, #0f1419)' }} />
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="text-white font-black text-lg leading-tight">{quest.title}</p>
                </div>
              </div>
            )}
            {/* Puan bilgisi */}
            <div className="p-5 text-center">
              <div className="text-5xl mb-2">🎉</div>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Hazineyi Buldun!</p>
              <p className="font-black text-5xl mb-1" style={{ color: '#ff6b2b' }}>+{done.points}</p>
              <p className="text-white/50 text-sm mb-3">puan kazandın</p>
              {done.cash > 0 && (
                <div className="inline-block px-4 py-1.5 rounded-full text-sm font-black mb-3" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
                  +{done.cash}₺ nakit ödül
                </div>
              )}
              {done.coop > 1 && (
                <p className="text-white/40 text-xs">{done.coop} kişiyle ortak — ödül paylaşıldı</p>
              )}
              <div className="mt-4 pt-4 flex items-center justify-center gap-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-white/30 text-xs">izibul.com</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-white/30 text-xs">🗺️ Konumu bul, ödülü kazan</span>
              </div>
            </div>
          </div>
        )}

        <div className="w-full max-w-sm flex flex-col gap-2">
          <button
            onClick={shareWin}
            className="w-full py-3.5 rounded-xl font-black text-white flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)', boxShadow: '0 6px 20px rgba(255,107,43,0.4)' }}
          >
            🚀 Paylaş — Arkadaşlarını zorla!
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-3 rounded-xl font-semibold text-sm"
            style={{ background: '#f7f8f8', color: '#536471' }}
          >
            Ana Sayfaya Dön
          </button>
        </div>
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
              {step.has_question && step.has_image ? '❓+📷 Kombine'
               : step.has_question || step.step_type === 'question' ? '❓ Soru'
               : step.has_image || step.step_type === 'image' ? '📷 Fotoğraf'
               : '📍 Konum'}
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

        {/* Harita toggle */}
        <div style={{ borderBottom: '1px solid #eff3f4' }}>
          <button
            onClick={() => setShowMap(!showMap)}
            className="w-full py-2 text-xs font-semibold flex items-center justify-center gap-1.5"
            style={{ color: showMap ? '#ff6b2b' : '#536471' }}
          >
            <Map size={13} /> {showMap ? 'Haritayı Gizle' : 'Haritayı Göster'}
          </button>
          {showMap && (
            <div className="px-3 pb-3">
              <div style={{ height: 200 }} className="rounded-xl overflow-hidden">
                <QuestMap
                  userLat={coords?.lat ?? null}
                  userLng={coords?.lng ?? null}
                  targetLat={step.target_lat}
                  targetLng={step.target_lng}
                  radiusMeters={step.approach_radius_meters}
                  inRange={inRange}
                />
              </div>
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
              {/* Soru - if has_question OR old step_type === 'question' */}
              {(step.has_question || step.step_type === 'question') && step.question && (
                <div>
                  <p className="font-bold text-sm mb-2" style={{ color: '#0f1419' }}>{step.question}</p>
                  <input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Cevabını yaz..."
                    className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                    style={{ background: '#f7f8f8', border: '1px solid #eff3f4', color: '#0f1419' }} />
                </div>
              )}

              {/* Referans fotoğrafı — kullanıcı ne çekeceğini görsün */}
              {isLastStep && quest.photo_url && (
                <div>
                  <p className="font-bold text-xs mb-2 uppercase tracking-wide" style={{ color: '#536471' }}>Referans Fotoğraf</p>
                  <div className="rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
                    <img src={quest.photo_url} alt="Referans" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              {/* Fotoğraf - if has_image OR old step_type === 'image' */}
              {(step.has_image || step.step_type === 'image') && (
                <div>
                  <p className="font-bold text-sm mb-2" style={{ color: '#0f1419' }}>
                    {isLastStep ? 'Şimdi sen çek — hazineyi bul!' : 'Bu adım için fotoğraf çek'}
                  </p>
                  <PhotoUpload onUpload={setPhoto} />
                </div>
              )}

              {error && (
                <div className="rounded-xl p-3 flex items-start gap-2 text-sm" style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626' }}>
                  <AlertCircle size={15} className="shrink-0 mt-0.5" /><span>{error}</span>
                </div>
              )}

              {/* AI sonucu */}
              {aiResult && (
                <div className="rounded-xl p-4 text-sm" style={{
                  background: aiResult.accepted ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${aiResult.accepted ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  color: aiResult.accepted ? '#16a34a' : '#dc2626',
                }}>
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {aiResult.accepted ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                    Eşleşme: %{aiResult.match}
                  </div>
                  <p className="text-xs opacity-80">{aiResult.reasoning}</p>
                </div>
              )}

              {/* Aksiyon */}
              {isLastStep ? (
                <button
                  onClick={async () => {
                    const needsQuestion = step.has_question || step.step_type === 'question';
                    const needsImage = step.has_image || step.step_type === 'image';
                    if (needsQuestion && !answer.trim()) { setError('Önce soruyu cevapla.'); return; }
                    if (needsImage && !photo) { setError('Önce fotoğraf çek.'); return; }
                    setError('');

                    // Fotoğraflı görevde AI kontrolü yap
                    if (needsImage && photo) {
                      setAiLoading(true);
                      setAiResult(null);
                      try {
                        const res = await fetch('/api/submissions/verify', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ quest_id: quest.id, user_photo_url: photo }),
                        });
                        const data = await res.json();
                        setAiResult(data);
                        setAiLoading(false);
                        if (!data.accepted) {
                          setError('Fotoğraf uyuşmadı. Doğru konumdan tekrar çekmeyi dene.');
                          return;
                        }
                      } catch {
                        setAiLoading(false);
                      }
                    }

                    setShowAR(true);
                  }}
                  disabled={submitting || aiLoading}
                  className="w-full font-black py-3.5 rounded-xl flex items-center justify-center gap-2 text-white"
                  style={{ background: 'linear-gradient(135deg,#ffd700,#ff6b2b)', boxShadow: '0 6px 20px rgba(255,107,43,0.4)' }}>
                  {aiLoading ? (
                    <><ScanLine size={16} className="animate-pulse" /> Yapay Zeka Analiz Ediyor...</>
                  ) : (
                    <>✨ Kamerayı Aç — Hazineyi Bul</>
                  )}
                </button>
              ) : (
                (() => {
                  const needsQuestion = step.has_question || step.step_type === 'question';
                  const needsImage = step.has_image || step.step_type === 'image';
                  const canSubmit = !(needsQuestion && !answer.trim()) && !(needsImage && !photo);
                  return (
                    <button onClick={submitStep} disabled={submitting || !canSubmit}
                      className="w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-white disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
                      {submitting ? <><Loader2 size={16} className="animate-spin" /> Kontrol ediliyor...</> : <><CheckCircle size={16} /> Bu Adımı Tamamla</>}
                    </button>
                  );
                })()
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
