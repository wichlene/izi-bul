import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rateLimit';
import { notifyUsers } from '@/lib/notify';

export async function GET(req: NextRequest) {
  // Kimlik doğrulama cookie tabanlı (RLS client)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 });

  const withUserId = req.nextUrl.searchParams.get('with');
  if (!withUserId) return NextResponse.json({ error: 'with param gerekli' }, { status: 400 });

  // Okuma/yazma service role ile — RLS'e takılmasın
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('messages')
    .select('*')
    .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${withUserId}),and(from_user_id.eq.${withUserId},to_user_id.eq.${user.id})`)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Karşıdan gelen okunmamışları okundu işaretle
  await admin.from('messages').update({ is_read: true })
    .eq('from_user_id', withUserId).eq('to_user_id', user.id).eq('is_read', false);

  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 });

  if (!checkRateLimit(`msg:${user.id}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Çok fazla mesaj gönderdin' }, { status: 429 });
  }

  const { to_user_id, content } = await req.json();
  if (!to_user_id || !content?.trim()) return NextResponse.json({ error: 'Eksik alan' }, { status: 400 });
  if (content.length > 500) return NextResponse.json({ error: 'Mesaj çok uzun' }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.from('messages').insert({
    from_user_id: user.id,
    to_user_id,
    content: content.trim(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mesajı alan kişiye push bildirim gönder
  const { data: sender } = await admin.from('profiles').select('username').eq('id', user.id).single();
  notifyUsers({
    user_ids: [to_user_id],
    type: 'message',
    title: `💬 ${sender?.username || 'Biri'} sana mesaj gönderdi`,
    body: content.trim().slice(0, 80),
    actor_id: user.id,
    actor_username: sender?.username,
    link: '/messages',
  }).catch(() => {});

  return NextResponse.json(data, { status: 201 });
}
