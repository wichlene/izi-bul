import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';

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

  const admin = createAdminClient();
  const { data: sub } = await admin.from('submissions').select('*, quests(points, title, cash_reward)').eq('id', submissionId).single();
  if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const quest = (sub as { quests?: { points?: number; title?: string; cash_reward?: number } }).quests;
  const points = quest?.points || 100;

  await admin.from('submissions').update({ status: 'approved', is_winner: true, points_earned: points, reviewed_at: new Date().toISOString() }).eq('id', submissionId);

  const { data: prof } = await admin.from('profiles').select('total_points, total_finds').eq('id', sub.user_id).single();
  if (prof) {
    await admin.from('profiles').update({ total_points: prof.total_points + points, total_finds: prof.total_finds + 1 }).eq('id', sub.user_id);
  }

  // Kullanıcıya bildirim maili
  const { data: { user: winner } } = await admin.auth.admin.getUserById(sub.user_id);
  if (winner?.email) {
    await sendEmail({
      to: winner.email,
      subject: '🎉 Tebrikler! Görevi çözdün',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0a0a0f;color:#fff;padding:32px;border-radius:16px">
          <h1 style="color:#ff6b2b;margin-bottom:8px">Tebrikler! 🎉</h1>
          <p style="color:rgba(255,255,255,0.7)">"<strong>${quest?.title || 'Görev'}</strong>" adlı görevi çözdün ve kazandın!</p>
          ${quest?.cash_reward ? `<p style="font-size:24px;font-weight:900;color:#22c55e">${quest.cash_reward}₺ nakit ödül</p>` : ''}
          <p style="color:rgba(255,255,255,0.4);font-size:13px">Ödül için görev sahibiyle iletişime geç.</p>
        </div>
      `,
    });
  }

  return NextResponse.json({ ok: true });
}
