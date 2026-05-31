'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Medal, Loader2 } from 'lucide-react';

type Period = 'all' | 'week' | 'month';

interface Entry {
  id: string;
  username: string;
  avatar_url: string | null;
  total_points: number;
  total_finds: number;
}

const TABS: { id: Period; label: string }[] = [
  { id: 'all', label: 'Tüm Zamanlar' },
  { id: 'month', label: 'Bu Ay' },
  { id: 'week', label: 'Bu Hafta' },
];

const MEDAL_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32'];

function Avatar({ entry, rank }: { entry: Entry; rank: number }) {
  const initials = entry.username?.charAt(0).toUpperCase() || '?';
  const gradients = [
    'linear-gradient(135deg,#ffd700,#ff6b2b)',
    'linear-gradient(135deg,#c0c0c0,#9ca3af)',
    'linear-gradient(135deg,#cd7f32,#92400e)',
  ];
  const bg = rank <= 3 ? gradients[rank - 1] : 'linear-gradient(135deg,#ff6b2b,#a855f7)';

  if (entry.avatar_url) {
    return (
      <img src={entry.avatar_url} alt={entry.username}
        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
        style={{ border: rank <= 3 ? `2px solid ${MEDAL_COLORS[rank - 1]}` : '2px solid #eff3f4' }} />
    );
  }
  return (
    <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-white flex-shrink-0"
      style={{ background: bg }}>
      {initials}
    </div>
  );
}

export default function LeaderboardClient() {
  const [period, setPeriod] = useState<Period>('all');
  const [data, setData] = useState<Entry[] | null>(null);

  const changePeriod = (p: Period) => {
    setData(null);
    setPeriod(p);
  };

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/leaderboard?period=${period}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setData(Array.isArray(d) ? d : []); })
      .catch(() => { if (!cancelled) setData([]); });
    return () => { cancelled = true; };
  }, [period]);

  const loading = data === null;

  return (
    <>
      {/* Başlık */}
      <div className="sticky top-0 z-10 px-4 py-4" style={{ background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #eff3f4' }}>
        <h1 className="text-xl font-black flex items-center gap-2" style={{ color: '#0f1419' }}>
          <Trophy size={22} style={{ color: '#ffd700' }} /> Sıralama
        </h1>

        {/* Dönem seçici */}
        <div className="flex gap-1 mt-3 p-1 rounded-full" style={{ background: '#f7f8f8' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => changePeriod(t.id)}
              className="flex-1 py-1.5 rounded-full text-xs font-bold transition-all"
              style={period === t.id
                ? { background: '#fff', color: '#ff6b2b', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
                : { color: '#536471' }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 podium */}
      {!loading && data && data.length >= 3 && (
        <div className="flex items-end justify-center gap-3 px-6 pt-6 pb-4" style={{ borderBottom: '1px solid #eff3f4' }}>
          {/* 2. */}
          <div className="flex flex-col items-center gap-2 mb-2">
            <Link href={`/user/${data[1].id}`} className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity">
              <div className="relative">
                <Avatar entry={data[1]} rank={2} />
                <span className="absolute -bottom-1 -right-1 text-base">🥈</span>
              </div>
              <p className="text-xs font-bold truncate max-w-[72px] text-center" style={{ color: '#0f1419' }}>@{data[1].username}</p>
              <p className="text-xs font-black" style={{ color: '#536471' }}>{data[1].total_points.toLocaleString()}</p>
            </Link>
            <div className="w-20 rounded-t-xl flex items-center justify-center text-lg font-black text-white" style={{ height: 64, background: 'linear-gradient(180deg,#c0c0c0,#9ca3af)' }}>2</div>
          </div>
          {/* 1. */}
          <div className="flex flex-col items-center gap-2">
            <Link href={`/user/${data[0].id}`} className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity">
              <div className="text-2xl mb-1">👑</div>
              <div className="relative">
                <Avatar entry={data[0]} rank={1} />
                <span className="absolute -bottom-1 -right-1 text-base">🥇</span>
              </div>
              <p className="text-xs font-bold truncate max-w-[72px] text-center" style={{ color: '#0f1419' }}>@{data[0].username}</p>
              <p className="text-xs font-black" style={{ color: '#ff6b2b' }}>{data[0].total_points.toLocaleString()}</p>
            </Link>
            <div className="w-20 rounded-t-xl flex items-center justify-center text-lg font-black text-white" style={{ height: 88, background: 'linear-gradient(180deg,#ffd700,#ff6b2b)' }}>1</div>
          </div>
          {/* 3. */}
          <div className="flex flex-col items-center gap-2 mb-2">
            <Link href={`/user/${data[2].id}`} className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity">
              <div className="relative">
                <Avatar entry={data[2]} rank={3} />
                <span className="absolute -bottom-1 -right-1 text-base">🥉</span>
              </div>
              <p className="text-xs font-bold truncate max-w-[72px] text-center" style={{ color: '#0f1419' }}>@{data[2].username}</p>
              <p className="text-xs font-black" style={{ color: '#536471' }}>{data[2].total_points.toLocaleString()}</p>
            </Link>
            <div className="w-20 rounded-t-xl flex items-center justify-center text-lg font-black text-white" style={{ height: 52, background: 'linear-gradient(180deg,#cd7f32,#92400e)' }}>3</div>
          </div>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin" style={{ color: '#ff6b2b' }} />
        </div>
      ) : !data || data.length === 0 ? (
        <div className="py-24 text-center">
          <Trophy size={48} className="mx-auto mb-4" style={{ color: '#eff3f4' }} />
          <p className="font-black text-lg" style={{ color: '#0f1419' }}>Henüz kayıt yok</p>
          <p className="text-sm mt-1" style={{ color: '#536471' }}>Bu dönemde görev tamamlayan olmamış.</p>
        </div>
      ) : (
        <div>
          {data.slice(3).map((entry, i) => {
            const rank = i + 4;
            return (
              <Link key={entry.id} href={`/user/${entry.id}`}
                className="flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors"
                style={{ borderBottom: '1px solid #eff3f4' }}>
                <div className="w-8 text-center font-black text-sm" style={{ color: '#536471' }}>{rank}</div>
                <Avatar entry={entry} rank={rank} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ color: '#0f1419' }}>@{entry.username}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#536471' }}>{entry.total_finds} görev tamamlandı</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm" style={{ color: '#ff6b2b' }}>{entry.total_points.toLocaleString()}</p>
                  <p className="text-[10px]" style={{ color: '#8e8e8e' }}>puan</p>
                </div>
                <Medal size={16} style={{ color: '#eff3f4' }} />
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
