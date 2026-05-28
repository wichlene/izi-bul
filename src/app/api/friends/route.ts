import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 });

  const [reqRes, friendRes] = await Promise.all([
    supabase.from('friend_requests')
      .select('*, from_user:profiles!friend_requests_from_user_id_fkey(id, username), to_user:profiles!friend_requests_to_user_id_fkey(id, username)')
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .eq('status', 'pending'),
    supabase.from('friendships')
      .select('*, friend:profiles!friendships_friend_id_fkey(id, username, total_finds)')
      .eq('user_id', user.id),
  ]);

  return NextResponse.json({
    requests: reqRes.data || [],
    friends: friendRes.data || [],
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 });

  const { action, to_user_id, request_id } = await req.json();

  if (action === 'send') {
    if (to_user_id === user.id) return NextResponse.json({ error: 'Kendine istek gönderemezsin' }, { status: 400 });
    const { error } = await supabase.from('friend_requests').insert({ from_user_id: user.id, to_user_id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'accept') {
    const { data: req2 } = await supabase.from('friend_requests').select('*').eq('id', request_id).single();
    if (!req2 || req2.to_user_id !== user.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
    await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', request_id);
    await supabase.from('friendships').insert([
      { user_id: user.id, friend_id: req2.from_user_id },
      { user_id: req2.from_user_id, friend_id: user.id },
    ]);
    return NextResponse.json({ ok: true });
  }

  if (action === 'reject') {
    await supabase.from('friend_requests').update({ status: 'rejected' }).eq('id', request_id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Geçersiz aksiyon' }, { status: 400 });
}
