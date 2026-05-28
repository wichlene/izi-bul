import Link from 'next/link';
import { Users, Zap, Star } from 'lucide-react';
import { Quest, DIFFICULTIES } from '@/types';
import { formatDistance } from '@/lib/distance';

interface Props {
  quest: Quest;
  distance?: number;
}

export default function QuestCard({ quest, distance }: Props) {
  const diff = DIFFICULTIES[quest.difficulty];

  return (
    <Link href={`/quest/${quest.id}`}>
      <div className="group relative rounded-2xl overflow-hidden border border-white/8 hover:border-white/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer h-full flex flex-col" style={{ background: 'rgba(255,255,255,0.03)' }}>

        {quest.is_featured && (
          <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,215,0,0.3)', background: 'linear-gradient(135deg, rgba(255,215,0,0.05), transparent)' }} />
        )}

        <div className="relative h-44 overflow-hidden bg-white/5">
          <img src={quest.photo_url} alt={quest.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.7))' }} />

          <div className="absolute top-3 left-3 flex gap-1.5">
            {quest.category && (
              <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.7)', color: quest.category.color, backdropFilter: 'blur(8px)' }}>
                {quest.category.icon} {quest.category.name}
              </span>
            )}
          </div>

          <div className="absolute top-3 right-3 flex gap-1.5">
            {quest.is_featured && (
              <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(255,215,0,0.2)', color: '#ffd700', backdropFilter: 'blur(8px)' }}>
                <Star size={10} fill="currentColor" /> Öne Çıkan
              </span>
            )}
            <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: diff.color + '33', color: diff.color, backdropFilter: 'blur(8px)' }}>
              {diff.label}
            </span>
          </div>

          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            {quest.region && <span className="text-xs text-white/80 font-medium">📍 {quest.region}</span>}
            {distance != null && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.7)', color: 'white', backdropFilter: 'blur(8px)' }}>
                {formatDistance(distance)}
              </span>
            )}
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-bold text-white mb-1.5 line-clamp-1 group-hover:text-orange-300 transition-colors">{quest.title}</h3>
          <p className="text-white/40 text-sm line-clamp-2 mb-4 flex-1">{quest.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm font-bold" style={{ color: '#22c55e' }}>
              {quest.cash_reward > 0 ? <span>{quest.cash_reward}₺ Ödül</span> : <span className="text-white/30">Ödülsüz</span>}
            </div>
            <div className="flex items-center gap-3 text-white/30 text-xs">
              <span className="flex items-center gap-1"><Users size={11} />{quest.total_solved}</span>
              {quest.total_solved === 0 && (
                <span className="flex items-center gap-1 text-yellow-400/70"><Zap size={11} />İlk ol!</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
