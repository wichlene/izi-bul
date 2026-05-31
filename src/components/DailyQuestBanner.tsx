import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Flame, Clock, Coins } from 'lucide-react';
import { DIFFICULTIES } from '@/types';

function getSecondsUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.floor((midnight.getTime() - now.getTime()) / 1000);
}

function formatCountdown(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return `${h}s ${m}dk`;
}

export default async function DailyQuestBanner() {
  const supabase = await createClient();
  const { data: quest } = await supabase
    .from('quests')
    .select('id, title, description, photo_url, difficulty, points, cash_reward, total_solved, region')
    .eq('is_featured', true)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!quest) return null;

  const diff = DIFFICULTIES[quest.difficulty as keyof typeof DIFFICULTIES];
  const secondsLeft = getSecondsUntilMidnight();

  return (
    <Link href={`/quest/${quest.id}`} className="block mx-4 mt-4 rounded-2xl overflow-hidden group"
      style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)', border: '1px solid rgba(255,107,43,0.3)' }}>
      <div className="relative">
        <img src={quest.photo_url} alt={quest.title}
          className="w-full h-40 object-cover opacity-30 group-hover:opacity-40 transition-opacity" />
        <div className="absolute inset-0 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full"
              style={{ background: 'rgba(0,0,0,0.35)' }}>
              <Flame size={14} className="text-white" />
              <span className="text-xs font-black text-white">GÜNÜN GÖREVİ</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full"
              style={{ background: 'rgba(0,0,0,0.35)' }}>
              <Clock size={12} className="text-white" />
              <span className="text-xs font-bold text-white">{formatCountdown(secondsLeft)}</span>
            </div>
          </div>
          <div>
            <h2 className="text-white font-black text-lg leading-tight mb-1">{quest.title}</h2>
            <div className="flex items-center gap-3">
              {quest.region && (
                <span className="text-xs text-white opacity-80">{quest.region}</span>
              )}
              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: diff?.color + '60' }}>
                {diff?.label}
              </span>
              <div className="flex items-center gap-1 text-xs text-white font-black">
                <Coins size={12} />
                {quest.points}p
                {quest.cash_reward > 0 && <span className="ml-1 text-yellow-300">+{quest.cash_reward}₺</span>}
              </div>
              <span className="text-xs text-white opacity-70">{quest.total_solved} kişi çözdü</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
