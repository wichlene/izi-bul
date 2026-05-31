import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendPushToUser } from '@/lib/webpush';
import { calculateDistance } from '@/lib/distance';

const NOTIFY_RADIUS_METERS = 500;
const COOLDOWN_MINUTES = 30; // Aynı görev için 30dk'da bir bildirim

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false });

  const { latitude, longitude } = await req.json();
  if (!latitude || !longitude) return NextResponse.json({ ok: false });

  const admin = createAdminClient();

  // Kullanıcının push aboneliklerini al
  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', user.id);

  if (!subs?.length) return NextResponse.json({ ok: false });

  // Aktif görevleri al (zaten tamamlamadıkları)
  const now = new Date().toISOString();
  const { data: quests } = await admin
    .from('quests')
    .select('id, title, cash_reward, latitude, longitude, max_distance_meters')
    .eq('is_active', true)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .limit(100);

  if (!quests?.length) return NextResponse.json({ ok: false });

  // Kullanıcının son kazandığı görevleri hariç tut
  const { data: wonSubs } = await admin
    .from('submissions')
    .select('quest_id')
    .eq('user_id', user.id)
    .eq('is_winner', true);

  const wonIds = new Set((wonSubs || []).map(s => s.quest_id));

  // Cooldown için son bildirimleri kontrol et
  const cooldownSince = new Date(Date.now() - COOLDOWN_MINUTES * 60_000).toISOString();
  const { data: recentNotifs } = await admin
    .from('notifications')
    .select('body')
    .eq('user_id', user.id)
    .eq('type', 'nearby_quest')
    .gte('created_at', cooldownSince);

  const recentQuestIds = new Set(
    (recentNotifs || []).map(n => n.body).filter(Boolean)
  );

  // Yakındaki görevleri bul
  const nearby = quests.filter(q => {
    if (wonIds.has(q.id)) return false;
    if (recentQuestIds.has(q.id)) return false;
    const dist = calculateDistance(latitude, longitude, q.latitude, q.longitude);
    return dist <= NOTIFY_RADIUS_METERS;
  });

  if (!nearby.length) return NextResponse.json({ ok: false });

  // En yakın görevi seç
  const closest = nearby.sort((a, b) =>
    calculateDistance(latitude, longitude, a.latitude, a.longitude) -
    calculateDistance(latitude, longitude, b.latitude, b.longitude)
  )[0];

  const rewardText = closest.cash_reward > 0 ? ` • ${closest.cash_reward}₺ ödül` : '';
  const distMeters = Math.round(calculateDistance(latitude, longitude, closest.latitude, closest.longitude));

  await Promise.all([
    sendPushToUser(subs, {
      title: `🗺️ ${distMeters}m yakınında görev var!`,
      body: `${closest.title}${rewardText}`,
      url: `/quest/${closest.id}`,
    }),
    admin.from('notifications').insert({
      user_id: user.id,
      type: 'nearby_quest',
      title: `${distMeters}m yakınında görev: ${closest.title}`,
      body: closest.id,
      link: `/quest/${closest.id}`,
      is_read: false,
    }),
  ]);

  return NextResponse.json({ ok: true, questId: closest.id });
}
