'use client';

import { useState, useEffect } from 'react';
import { BadgeDef } from '@/lib/badges';

interface Data {
  streak: number;
  maxStreak: number;
  badges: BadgeDef[];
}

function StreakFlame({ streak }: { streak: number }) {
  const size = streak === 0 ? 'text-2xl' : streak < 3 ? 'text-3xl' : streak < 7 ? 'text-4xl' : 'text-5xl';
  return (
    <div className="flex flex-col items-center">
      <span className={`${size} leading-none`} style={{ filter: streak > 0 ? 'drop-shadow(0 0 8px #ff6b2b)' : 'grayscale(1) opacity(0.3)' }}>🔥</span>
      <span className="font-black text-sm mt-0.5" style={{ color: streak > 0 ? '#ff6b2b' : '#8e8e8e' }}>{streak}</span>
      <span className="text-[10px]" style={{ color: '#8e8e8e' }}>gün seri</span>
    </div>
  );
}

export default function StreakBadges({ userId }: { userId: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch(`/api/profile/badges?userId=${userId}`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {});
  }, [userId]);

  if (!data) return null;

  const visible = showAll ? data.badges : data.badges.slice(0, 8);
  const locked = showAll ? [] : [];

  return (
    <div className="px-4 py-4" style={{ borderBottom: '1px solid #eff3f4' }}>
      {/* Streak */}
      <div className="flex items-center gap-4 mb-4">
        <StreakFlame streak={data.streak} />
        <div className="flex-1">
          <p className="font-black text-sm" style={{ color: '#0f1419' }}>
            {data.streak === 0 ? 'Seri başlatmadın' : data.streak === 1 ? '1 günlük seri!' : `${data.streak} günlük ateş serisi! 🔥`}
          </p>
          <p className="text-xs" style={{ color: '#536471' }}>
            {data.streak === 0
              ? 'Bugün bir görev tamamla ve serine başla'
              : `En yüksek: ${data.maxStreak} gün`}
          </p>
        </div>
      </div>

      {/* Rozetler */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#536471' }}>
          Rozetler ({data.badges.length})
        </p>
        {data.badges.length > 8 && (
          <button onClick={() => setShowAll(!showAll)} className="text-xs font-semibold" style={{ color: '#ff6b2b' }}>
            {showAll ? 'Azalt' : 'Tümünü gör'}
          </button>
        )}
      </div>

      {data.badges.length === 0 ? (
        <p className="text-xs" style={{ color: '#8e8e8e' }}>Henüz rozet kazanmadın. Görev tamamla!</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {visible.map(b => (
            <div key={b.id} className="group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full cursor-default"
              style={{ background: 'rgba(255,107,43,0.08)', border: '1px solid rgba(255,107,43,0.15)' }}>
              <span className="text-base leading-none">{b.icon}</span>
              <span className="text-xs font-bold" style={{ color: '#0f1419' }}>{b.name}</span>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                style={{ background: '#0f1419' }}>
                {b.description}
              </div>
            </div>
          ))}
          {locked.map((_, i) => (
            <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: '#f7f8f8', border: '1px dashed #eff3f4' }}>
              <span className="text-sm opacity-30">?</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
