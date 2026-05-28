'use client';

import { useState } from 'react';
import { Quest, Category, DIFFICULTIES, Difficulty } from '@/types';
import QuestCard from './QuestCard';
import { calculateDistance, formatDistance } from '@/lib/distance';
import { Trophy, Clock, Navigation, Loader2, Zap } from 'lucide-react';

interface Props {
  quests: Quest[];
  categories: Category[];
}

type SortType = 'newest' | 'reward' | 'near';

export default function QuestList({ quests, categories }: Props) {
  const [catFilter, setCatFilter] = useState('all');
  const [diffFilter, setDiffFilter] = useState('all');
  const [sort, setSort] = useState<SortType>('newest');
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);

  const handleNearMe = () => {
    if (sort === 'near') { setSort('newest'); return; }
    if (userPos) { setSort('near'); return; }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSort('near');
        setLocLoading(false);
      },
      () => setLocLoading(false),
      { enableHighAccuracy: true }
    );
  };

  let filtered = quests.filter((q) => {
    if (catFilter !== 'all' && q.category_id !== catFilter) return false;
    if (diffFilter !== 'all' && q.difficulty !== diffFilter) return false;
    return true;
  });

  if (sort === 'reward') {
    filtered = [...filtered].sort((a, b) => b.cash_reward - a.cash_reward);
  } else if (sort === 'near' && userPos) {
    filtered = [...filtered].sort((a, b) =>
      calculateDistance(userPos.lat, userPos.lng, a.latitude, a.longitude) -
      calculateDistance(userPos.lat, userPos.lng, b.latitude, b.longitude)
    );
  }

  const difficulties = Object.keys(DIFFICULTIES) as Difficulty[];

  const btnBase = { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.06)' };

  return (
    <div>
      {/* Kategori */}
      <div className="overflow-x-auto -mx-4 px-4 pb-2">
        <div className="flex gap-2 min-w-max">
          <button onClick={() => setCatFilter('all')} className="px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap"
            style={catFilter === 'all' ? { background: 'rgba(255,107,43,0.2)', color: '#ff6b2b', border: '1px solid rgba(255,107,43,0.3)' } : btnBase}>
            Tümü
          </button>
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setCatFilter(catFilter === cat.id ? 'all' : cat.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap"
              style={catFilter === cat.id ? { background: cat.color + '30', color: cat.color, border: `1px solid ${cat.color}50` } : btnBase}>
              <span>{cat.icon}</span>{cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Zorluk + Sıralama */}
      <div className="flex flex-wrap items-center gap-2 mt-3 mb-5">
        <div className="flex gap-1.5 flex-wrap">
          {difficulties.map((d) => {
            const diff = DIFFICULTIES[d];
            return (
              <button key={d} onClick={() => setDiffFilter(diffFilter === d ? 'all' : d)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={diffFilter === d ? { background: diff.color + '25', color: diff.color, border: `1px solid ${diff.color}40` } : btnBase}>
                {diff.label}
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex gap-1.5">
          <button onClick={() => setSort('newest')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={sort === 'newest' ? { background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' } : btnBase}>
            <Clock size={11} /> Yeni
          </button>
          <button onClick={() => setSort('reward')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={sort === 'reward' ? { background: 'rgba(34,197,94,0.2)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' } : btnBase}>
            <Trophy size={11} /> En Yüksek Ödül
          </button>
          <button onClick={handleNearMe} disabled={locLoading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={sort === 'near' ? { background: 'rgba(59,130,246,0.2)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' } : btnBase}>
            {locLoading ? <Loader2 size={11} className="animate-spin" /> : <Navigation size={11} />} Yakınımdaki
          </button>
        </div>
      </div>

      {/* Başlık */}
      <div className="flex items-center gap-2 mb-4">
        <Zap size={18} style={{ color: '#ff6b2b' }} />
        <h2 className="text-lg font-bold text-white">
          {sort === 'near' ? 'Yakınımdaki Görevler' : sort === 'reward' ? 'En Yüksek Ödüller' : 'Tüm Görevler'}
        </h2>
        <span className="text-sm font-normal px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,107,43,0.15)', color: '#ff6b2b' }}>
          {filtered.length}
        </span>
        {sort === 'near' && userPos && filtered[0] && (
          <span className="text-xs text-white/30 ml-auto">
            En yakın: {formatDistance(calculateDistance(userPos.lat, userPos.lng, filtered[0].latitude, filtered[0].longitude))}
          </span>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-white/5 rounded-3xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-white/30">Bu filtreyle görev bulunamadı.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((q) => (
            <QuestCard
              key={q.id}
              quest={q}
              distance={sort === 'near' && userPos
                ? Math.round(calculateDistance(userPos.lat, userPos.lng, q.latitude, q.longitude))
                : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
