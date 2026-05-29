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
      <div
        className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer h-full flex flex-col"
        style={{ background: '#ffffff', border: '1px solid #eff3f4' }}
      >

        {quest.is_featured && (
          <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,215,0,0.4)', background: 'linear-gradient(135deg, rgba(255,215,0,0.04), transparent)' }} />
        )}

        <div className="relative h-44 overflow-hidden" style={{ background: '#f7f8f8' }}>
          <img src={quest.photo_url} alt={quest.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.55))' }} />

          <div className="absolute top-3 left-3 flex gap-1.5">
            {quest.category && (
              <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.6)', color: quest.category.color, backdropFilter: 'blur(8px)' }}>
                {quest.category.icon} {quest.category.name}
              </span>
            )}
          </div>

          <div className="absolute top-3 right-3 flex gap-1.5">
            {quest.is_featured && (
              <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(255,215,0,0.25)', color: '#b45309', backdropFilter: 'blur(8px)' }}>
                <Star size={10} fill="currentColor" /> Öne Çıkan
              </span>
            )}
            <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: diff.color + '33', color: diff.color, backdropFilter: 'blur(8px)' }}>
              {diff.label}
            </span>
          </div>

          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            {quest.region && <span className="text-xs text-white/90 font-medium">📍 {quest.region}</span>}
            {distance != null && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.75)', color: 'white', backdropFilter: 'blur(8px)' }}>
                {formatDistance(distance)}
              </span>
            )}
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-bold mb-1.5 line-clamp-1 transition-colors" style={{ color: '#0f1419' }}>{quest.title}</h3>
          <p className="text-sm line-clamp-2 mb-4 flex-1" style={{ color: '#536471' }}>{quest.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm font-bold" style={{ color: '#22c55e' }}>
              {quest.cash_reward > 0 ? <span>{quest.cash_reward}₺ Ödül</span> : <span style={{ color: '#536471' }}>Ödülsüz</span>}
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: '#536471' }}>
              <span className="flex items-center gap-1"><Users size={11} />{quest.total_solved}</span>
              {quest.total_solved === 0 && (
                <span className="flex items-center gap-1 text-yellow-500"><Zap size={11} />İlk ol!</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
