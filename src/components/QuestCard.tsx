import Link from 'next/link';
import { Users, Zap, Star, Coins } from 'lucide-react';
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
        className="group relative rounded-2xl overflow-hidden transition-all duration-200 active:scale-[0.98] cursor-pointer"
        style={{ background: '#ffffff', border: '1px solid #eff3f4' }}
      >
        {quest.is_featured && (
          <div className="absolute inset-0 rounded-2xl pointer-events-none z-10"
            style={{ boxShadow: 'inset 0 0 0 1.5px rgba(255,215,0,0.5)' }} />
        )}

        {/* Fotoğraf */}
        <div className="relative overflow-hidden" style={{ height: 160, background: '#f7f8f8' }}>
          <img
            src={quest.photo_url}
            alt={quest.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            style={!quest.is_active ? { filter: 'grayscale(0.6) brightness(0.85)' } : undefined}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6))' }} />
          {!quest.is_active && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-black px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(0,0,0,0.65)', color: '#fff', backdropFilter: 'blur(8px)', letterSpacing: '0.05em' }}>
                ✓ TAMAMLANDI
              </span>
            </div>
          )}

          {/* Sol üst: kategori */}
          <div className="absolute top-2.5 left-2.5 flex gap-1.5">
            {quest.category && (
              <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full"
                style={{ background: 'rgba(0,0,0,0.55)', color: quest.category.color, backdropFilter: 'blur(8px)' }}>
                {quest.category.icon} {quest.category.name}
              </span>
            )}
          </div>

          {/* Sağ üst: featured + zorluk */}
          <div className="absolute top-2.5 right-2.5 flex gap-1.5">
            {quest.is_featured && (
              <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full"
                style={{ background: 'rgba(255,215,0,0.25)', color: '#b45309', backdropFilter: 'blur(8px)' }}>
                <Star size={9} fill="currentColor" /> Öne Çıkan
              </span>
            )}
            <span className="text-[11px] font-bold px-2 py-1 rounded-full"
              style={{ background: diff.color + '33', color: diff.color, backdropFilter: 'blur(8px)' }}>
              {diff.label}
            </span>
          </div>

          {/* Alt: bölge + mesafe */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {quest.region && <span className="text-[11px] text-white/90 font-medium">📍 {quest.region}</span>}
            </div>
            {distance != null && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(59,130,246,0.75)', color: 'white', backdropFilter: 'blur(8px)' }}>
                {formatDistance(distance)}
              </span>
            )}
          </div>
        </div>

        {/* İçerik */}
        <div className="px-3.5 py-3">
          <h3 className="font-bold text-sm mb-0.5 line-clamp-1" style={{ color: '#0f1419' }}>{quest.title}</h3>
          <p className="text-xs line-clamp-2 mb-3 leading-relaxed" style={{ color: '#536471' }}>{quest.description}</p>

          <div className="flex items-center justify-between">
            {/* Ödül */}
            <div className="flex items-center gap-1">
              {quest.cash_reward > 0 ? (
                <span className="text-sm font-black" style={{ color: '#22c55e' }}>{quest.cash_reward}₺ Ödül</span>
              ) : (
                <div className="flex items-center gap-1 text-xs font-bold" style={{ color: '#ff6b2b' }}>
                  <Coins size={12} />{quest.points}p
                </div>
              )}
            </div>

            {/* İstatistik */}
            <div className="flex items-center gap-1 text-[11px]" style={{ color: '#8e9aab' }}>
              {quest.total_solved === 0 && quest.total_attempts > 0 ? (
                <span className="flex items-center gap-1 font-bold" style={{ color: '#f97316' }}>
                  <Zap size={10} />{quest.total_attempts} denedi, kimse bulamadı!
                </span>
              ) : quest.total_solved === 0 ? (
                <span className="flex items-center gap-1 font-bold" style={{ color: '#eab308' }}>
                  <Zap size={10} />İlk ol!
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Users size={10} />{quest.total_attempts} deneme · <span className="font-bold" style={{ color: '#22c55e' }}>✓ {quest.total_solved}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
