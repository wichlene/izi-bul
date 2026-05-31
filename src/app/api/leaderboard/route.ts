import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'all'; // all | week | month
  const admin = createAdminClient();

  if (period === 'all') {
    const { data, error } = await admin
      .from('profiles')
      .select('id, username, avatar_url, total_points, total_finds')
      .order('total_points', { ascending: false })
      .limit(50);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Haftalık / aylık: submissions tablosundan kazananları topla
  const days = period === 'week' ? 7 : 30;
  const since = new Date(Date.now() - days * 86400_000).toISOString();

  const { data: subs, error } = await admin
    .from('submissions')
    .select('user_id, points_earned, profiles:profiles!submissions_user_id_fkey(id, username, avatar_url)')
    .eq('is_winner', true)
    .gte('created_at', since);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Kullanıcı başına topla
  const map = new Map<string, { id: string; username: string; avatar_url: string | null; total_points: number; total_finds: number }>();
  for (const s of subs || []) {
    const p = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
    if (!p) continue;
    const existing = map.get(s.user_id);
    if (existing) {
      existing.total_points += s.points_earned || 0;
      existing.total_finds += 1;
    } else {
      map.set(s.user_id, { id: p.id, username: p.username, avatar_url: p.avatar_url, total_points: s.points_earned || 0, total_finds: 1 });
    }
  }

  const ranked = Array.from(map.values()).sort((a, b) => b.total_points - a.total_points).slice(0, 50);
  return NextResponse.json(ranked);
}
