import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Beğeni toggle
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 });

  const { post_id } = await req.json();
  if (!post_id) return NextResponse.json({ error: 'post_id gerekli' }, { status: 400 });

  const admin = createAdminClient();

  // Zaten beğenmiş mi?
  const { data: existing } = await admin
    .from('post_likes')
    .select('id')
    .eq('post_id', post_id)
    .eq('user_id', user.id)
    .maybeSingle();

  let liked: boolean;
  if (existing) {
    await admin.from('post_likes').delete().eq('id', existing.id);
    liked = false;
  } else {
    await admin.from('post_likes').insert({ post_id, user_id: user.id });
    liked = true;
  }

  const { count } = await admin
    .from('post_likes')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', post_id);

  return NextResponse.json({ liked, count: count || 0 });
}
