import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const formData = body ? null : await req.formData().catch(() => null);
  const submissionId = body?.submission_id || formData?.get('submission_id');

  if (!submissionId) return NextResponse.json({ error: 'Missing submission_id' }, { status: 400 });

  const { data: sub } = await supabase.from('submissions').select('*, quests(points)').eq('id', submissionId).single();
  if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await supabase.from('submissions').update({ status: 'approved', is_winner: true, points_earned: (sub as { quests?: { points?: number } }).quests?.points || 100, reviewed_at: new Date().toISOString() }).eq('id', submissionId);

  const points = (sub as { quests?: { points?: number } }).quests?.points || 100;
  const { data: prof } = await supabase.from('profiles').select('total_points, total_finds').eq('id', sub.user_id).single();
  if (prof) {
    await supabase.from('profiles').update({ total_points: prof.total_points + points, total_finds: prof.total_finds + 1 }).eq('id', sub.user_id);
  }

  return NextResponse.json({ ok: true });
}
