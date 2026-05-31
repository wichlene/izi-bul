export interface BadgeDef {
  id: string;
  icon: string;
  name: string;
  description: string;
}

export interface UserStats {
  totalWins: number;
  totalPoints: number;
  currentStreak: number;
  maxStreak: number;
  hasLegendary: boolean;
  hasNightWin: boolean;
  hasBigReward: boolean;
  regionCount: number;
}

export const BADGE_DEFS: BadgeDef[] = [
  { id: 'first_quest',    icon: '🏆', name: 'İlk Hazine',       description: 'İlk görevi tamamladın' },
  { id: 'five_quests',    icon: '🎯', name: 'Keskin Nişancı',    description: '5 görevi tamamladın' },
  { id: 'ten_quests',     icon: '⚡', name: 'Hızlı Avcı',       description: '10 görevi tamamladın' },
  { id: 'fifty_quests',   icon: '🌟', name: 'Yıldız Avcı',      description: '50 görevi tamamladın' },
  { id: 'streak_3',       icon: '🔥', name: 'Ateş Serisi',       description: '3 gün üst üste görev tamamladın' },
  { id: 'streak_7',       icon: '🌋', name: 'Yanardağ',          description: '7 gün üst üste görev tamamladın' },
  { id: 'legendary',      icon: '💎', name: 'Efsanevi',          description: 'Efsane zorluğunda görev bitirdin' },
  { id: 'night_owl',      icon: '🦉', name: 'Gececi',            description: 'Gece 22:00-05:00 arası görev tamamladın' },
  { id: 'big_reward',     icon: '💰', name: 'Büyük Balık',       description: '100₺+ ödüllü görev kazandın' },
  { id: 'explorer',       icon: '🗺️', name: 'Kâşif',            description: '3 farklı bölgede görev tamamladın' },
  { id: 'thousand_pts',   icon: '👑', name: 'Hazine Ustası',     description: '1000 puan kazandın' },
  { id: 'ten_k_pts',      icon: '💫', name: 'Efsane Koleksiyoner', description: '10.000 puan kazandın' },
];

export function computeEarnedBadges(stats: UserStats): BadgeDef[] {
  const checks: Record<string, boolean> = {
    first_quest:   stats.totalWins >= 1,
    five_quests:   stats.totalWins >= 5,
    ten_quests:    stats.totalWins >= 10,
    fifty_quests:  stats.totalWins >= 50,
    streak_3:      stats.maxStreak >= 3,
    streak_7:      stats.maxStreak >= 7,
    legendary:     stats.hasLegendary,
    night_owl:     stats.hasNightWin,
    big_reward:    stats.hasBigReward,
    explorer:      stats.regionCount >= 3,
    thousand_pts:  stats.totalPoints >= 1000,
    ten_k_pts:     stats.totalPoints >= 10000,
  };
  return BADGE_DEFS.filter(b => checks[b.id]);
}

export function computeStreak(winDates: string[]): { current: number; max: number } {
  if (!winDates.length) return { current: 0, max: 0 };

  const days = [...new Set(winDates.map(d => d.split('T')[0]))].sort().reverse();

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];

  let current = 0;
  if (days[0] === today || days[0] === yesterday) {
    current = 1;
    for (let i = 1; i < days.length; i++) {
      const a = new Date(days[i - 1]).getTime();
      const b = new Date(days[i]).getTime();
      if ((a - b) / 86_400_000 === 1) current++;
      else break;
    }
  }

  let max = 0;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const a = new Date(days[i - 1]).getTime();
    const b = new Date(days[i]).getTime();
    if ((a - b) / 86_400_000 === 1) { run++; max = Math.max(max, run); }
    else run = 1;
  }
  max = Math.max(max, run, current);

  return { current, max };
}
