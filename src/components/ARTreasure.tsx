'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Sparkles } from 'lucide-react';

interface Props {
  onOpen: () => void;
  onClose: () => void;
}

/**
 * Gerçek zamanlı kamera görüntüsü üzerine yapay hazine sandığı yerleştirir.
 * Kullanıcı tam konuma geldiğinde açılır; sandığa dokununca görev biter.
 */
export default function ARTreasure({ onOpen, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [camError, setCamError] = useState('');
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setCamError('Kamera açılamadı. İzin verdiğinden emin ol.');
      }
    })();
    return () => { stream?.getTracks().forEach((t) => t.stop()); };
  }, []);

  const handleTap = () => {
    if (opening) return;
    setOpening(true);
    // Açılma animasyonu sonrası bitir
    setTimeout(() => onOpen(), 1400);
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black flex items-center justify-center overflow-hidden">
      {/* Kamera görüntüsü */}
      <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />

      {camError ? (
        <div className="relative z-10 text-center px-8">
          <p className="text-white text-lg font-bold mb-2">📷</p>
          <p className="text-white/80 text-sm mb-6">{camError}</p>
          <button onClick={onClose} className="px-6 py-2.5 rounded-full font-bold text-white" style={{ background: '#ff6b2b' }}>
            Kapat
          </button>
        </div>
      ) : (
        <>
          {/* Üst bilgi */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }}>
            <div className="flex items-center gap-2 text-white">
              <Sparkles size={18} style={{ color: '#ffd700' }} />
              <span className="font-bold text-sm">Hazine tam burada!</span>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center text-white">
              <X size={18} />
            </button>
          </div>

          {/* AR Hazine Sandığı */}
          <button
            onClick={handleTap}
            className="relative z-10 flex flex-col items-center"
            style={{ animation: opening ? 'none' : 'arFloat 2.5s ease-in-out infinite' }}
          >
            {/* Işık halesi */}
            <div className="absolute inset-0 -m-12 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,215,0,0.45) 0%, transparent 70%)',
                animation: 'arPulse 2s ease-in-out infinite',
              }} />

            {/* Sandık SVG */}
            <div style={{ transform: opening ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.6s' }}>
              <svg width="150" height="150" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"
                style={{ filter: 'drop-shadow(0 12px 30px rgba(0,0,0,0.5))' }}>
                {/* Kapak */}
                <g style={{
                  transformOrigin: '60px 58px',
                  transform: opening ? 'rotateX(-110deg)' : 'rotateX(0deg)',
                  transition: 'transform 0.9s cubic-bezier(0.34,1.56,0.64,1)',
                }}>
                  <path d="M22 58 Q22 34 60 34 Q98 34 98 58 L98 60 L22 60 Z" fill="#8B5A2B" stroke="#5C3A1A" strokeWidth="3"/>
                  <rect x="22" y="52" width="76" height="8" fill="#FFD700" stroke="#B8860B" strokeWidth="2"/>
                </g>
                {/* Gövde */}
                <rect x="22" y="58" width="76" height="46" rx="4" fill="#A0682E" stroke="#5C3A1A" strokeWidth="3"/>
                <rect x="22" y="66" width="76" height="7" fill="#FFD700" stroke="#B8860B" strokeWidth="2"/>
                {/* Kilit */}
                <rect x="52" y="74" width="16" height="18" rx="3" fill="#FFD700" stroke="#B8860B" strokeWidth="2"/>
                <circle cx="60" cy="81" r="3" fill="#5C3A1A"/>
                {/* Açılınca taşan altınlar */}
                {opening && (
                  <g style={{ animation: 'arCoins 0.9s ease-out forwards' }}>
                    <circle cx="45" cy="50" r="6" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5"/>
                    <circle cx="60" cy="44" r="7" fill="#FFEC8B" stroke="#B8860B" strokeWidth="1.5"/>
                    <circle cx="75" cy="50" r="6" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5"/>
                  </g>
                )}
              </svg>
            </div>

            <div className="relative z-10 mt-4 px-6 py-2.5 rounded-full font-black text-white text-sm"
              style={{ background: opening ? '#22c55e' : 'linear-gradient(135deg,#ff6b2b,#ff3d00)', boxShadow: '0 6px 20px rgba(255,107,43,0.5)' }}>
              {opening ? '✨ Açılıyor...' : '👆 Sandığa dokun ve aç'}
            </div>
          </button>
        </>
      )}

      <style jsx>{`
        @keyframes arFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-16px); }
        }
        @keyframes arPulse {
          0%, 100% { opacity: 0.5; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes arCoins {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
