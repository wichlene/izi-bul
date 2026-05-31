import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { computeEarnedBadges, computeStreak, UserStats } from '@/lib/badges';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId gerekli' }, { status: 400 });

  const admin = createAdminClient();

  const [profileRes, subsRes] = await Promise.all([
    admin.from('profiles').select('total_points').eq('id', userId).single(),
    admin.from('submissions')
      .select('created_at, is_winner, points_earned, quest:quests(difficulty, cash_reward, region)')
      .eq('user_id', userId)
      .eq('is_winner', true)
      .order('created_at', { ascending: false }),
  ]);

  const subs = subsRes.data || [];
  const totalPoints = profileRes.data?.total_points || 0;

  const winDates = subs.map(s => s.created_at);
  const { current: currentStreak, max: maxStreak } = computeStreak(winDates);

  const regions = new Set<string>();
  let hasLegendary = false;
  let hasNightWin = false;
  let hasBigReward = false;

  for (const s of subs) {
    const q = Array.isArray(s.quest) ? s.quest[0] : s.quest;
    if (!q) continue;
    if (q.difficulty === 'legendary') hasLegendary = true;
    if ((q.cash_reward || 0) >= 100) hasBigReward = true;
    if (q.region) regions.add(q.region);
    const hour = new Date(s.created_at).getHours();
    if (hour >= 22 || hour < 5) hasNightWin = true;
  }

  const stats: UserStats = {
    totalWins: subs.length,
    totalPoints,
    currentStreak,
    maxStreak,
    hasLegendary,
    hasNightWin,
    hasBigReward,
    regionCount: regions.size,
  };

  const badges = computeEarnedBadges(stats);

  return NextResponse.json({ streak: currentStreak, maxStreak, badges, stats });
}
