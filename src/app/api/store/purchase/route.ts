import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { STORE_ITEMS } from '@/lib/storeItems';

function generateCode(itemId: string) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = itemId.toUpperCase().slice(0, 4) + '-';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 });

  const { itemId } = await req.json();
  const item = STORE_ITEMS.find(i => i.id === itemId);
  if (!item) return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('total_points')
    .eq('id', user.id)
    .single();

  if (!profile || profile.total_points < item.pointsCost) {
    return NextResponse.json({ error: `Yeterli puan yok. Gereken: ${item.pointsCost}, Mevcut: ${profile?.total_points || 0}` }, { status: 400 });
  }

  const admin = createAdminClient();

  // Puanları düş
  const { error: updateError } = await admin
    .from('profiles')
    .update({ total_points: profile.total_points - item.pointsCost })
    .eq('id', user.id);

  if (updateError) return NextResponse.json({ error: 'Puan güncellenemedi' }, { status: 500 });

  const code = generateCode(item.id);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // store_purchases tablosuna kaydet (yoksa atla)
  try {
    await admin.from('store_purchases').insert({
      user_id: user.id,
      item_id: item.id,
      item_title: item.title,
      points_spent: item.pointsCost,
      redemption_code: code,
      expires_at: expiresAt,
      status: 'active',
    });
  } catch {
    // Tablo henüz yoksa bildiri yine döner
  }

  return NextResponse.json({
    success: true,
    code,
    item: { title: item.title, icon: item.icon },
    pointsSpent: item.pointsCost,
    remainingPoints: profile.total_points - item.pointsCost,
    expiresAt,
  });
}
