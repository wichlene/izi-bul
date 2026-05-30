import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rateLimit';
import { notifyUsers, getFriendIds } from '@/lib/notify';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const type = req.nextUrl.searchParams.get('type');
  const userId = req.nextUrl.searchParams.get('user_id');

  let query = supabase
    .from('posts')
    .select('*, profiles(username, avatar_url), quests(title, photo_url, cash_reward)')
    .order('created_at', { ascending: false })
    .limit(50);
  if (type) query = query.eq('post_type', type);
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const posts = data || [];

  // Beğenileri ayrı çek — tablo yoksa feed yine çalışır
  const likeCount: Record<string, number> = {};
  const likedSet = new Set<string>();
  if (posts.length) {
    const { data: likeRows } = await supabase
      .from('post_likes')
      .select('post_id, user_id')
      .in('post_id', posts.map((p: { id: string }) => p.id));
    for (const row of likeRows || []) {
      likeCount[row.post_id] = (likeCount[row.post_id] || 0) + 1;
      if (user && row.user_id === user.id) likedSet.add(row.post_id);
    }
  }

  // Yorum sayıları
  const commentCount: Record<string, number> = {};
  if (posts.length) {
    const { data: commentRows } = await supabase
      .from('post_comments')
      .select('post_id')
      .in('post_id', posts.map((p: { id: string }) => p.id));
    for (const row of commentRows || []) {
      commentCount[row.post_id] = (commentCount[row.post_id] || 0) + 1;
    }
  }

  const enriched = posts.map((p: { id: string } & Record<string, unknown>) => ({
    ...p,
    like_count: likeCount[p.id] || 0,
    liked_by_me: likedSet.has(p.id),
    comment_count: commentCount[p.id] || 0,
  }));

  return NextResponse.json(enriched);
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

  // Arkadaşlara bildirim gönder
  if (type === 'good_deed' || type === 'social') {
    const posterProfile = (data as { profiles?: { username?: string } }).profiles;
    const username = Array.isArray(posterProfile) ? posterProfile[0]?.username : posterProfile?.username;
    const friendIds = await getFriendIds(user.id);
    if (friendIds.length) {
      await notifyUsers({
        user_ids: friendIds,
        type: type === 'good_deed' ? 'good_deed' : 'info',
        title: type === 'good_deed'
          ? `@${username || 'biri'} bir iyilik paylaştı 💗`
          : `@${username || 'biri'} bir şey paylaştı`,
        body: content.trim().slice(0, 80),
        actor_id: user.id,
        actor_username: username,
        link: '/dashboard',
      });
    }
  }

  return NextResponse.json(data, { status: 201 });
}
