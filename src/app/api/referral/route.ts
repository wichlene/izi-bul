import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const BONUS = 50; // Her iki tarafa verilecek puan

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'auth' }, { status: 401 });

  const { ref_code } = await req.json();
  if (!ref_code || typeof ref_code !== 'string') return NextResponse.json({ ok: false });

  const admin = createAdminClient();

  // ref_code = ilk 8 karakter → hangi kullanıcıya ait?
  const { data: referrers } = await admin
    .from('profiles')
    .select('id, total_points')
    .ilike('id', `${ref_code}%`)
    .neq('id', user.id)
    .limit(1);

  const referrer = referrers?.[0];
  if (!referrer) return NextResponse.json({ ok: false });

  // Referrer'a bonus
  await admin.from('profiles').update({ total_points: (referrer.total_points || 0) + BONUS }).eq('id', referrer.id);

  // Yeni kullanıcıya bonus
  const { data: newProfile } = await admin.from('profiles').select('total_points').eq('id', user.id).single();
  await admin.from('profiles').update({ total_points: ((newProfile?.total_points) || 0) + BONUS }).eq('id', user.id);

  // Referrer'a bildirim
  await admin.from('notifications').insert({
    user_id: referrer.id,
    type: 'info',
    title: `Davet ettiğin biri İzi Bul'a katıldı! +${BONUS} puan kazandın 🎁`,
    body: 'Davet bonusun hesabına eklendi.',
    is_read: false,
  });

  return NextResponse.json({ ok: true });
}
