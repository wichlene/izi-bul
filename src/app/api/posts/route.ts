import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const type = req.nextUrl.searchParams.get('type');
  let query = supabase
    .from('posts')
    .select('*, profiles(username, avatar_url), quests(title, photo_url, cash_reward)')
    .order('created_at', { ascending: false })
    .limit(50);
  if (type) query = query.eq('post_type', type);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 });

  if (!checkRateLimit(`post:${user.id}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Çok hızlı. Biraz bekle.' }, { status: 429 });
  }

  const { content, post_type, photo_url, latitude, longitude } = await req.json();
  if (!content || !content.trim()) return NextResponse.json({ error: 'İçerik boş olamaz' }, { status: 400 });

  // İzin verilen türler
  const allowed = ['social', 'good_deed', 'announcement'];
  let type = allowed.includes(post_type) ? post_type : 'social';

  // Duyuru sadece adminler
  if (type === 'announcement') {
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) type = 'social';
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from('posts').insert({
    user_id: user.id,
    post_type: type,
    content: content.trim().slice(0, 500),
    photo_url: photo_url || null,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
  }).select('*, profiles(username, avatar_url)').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
