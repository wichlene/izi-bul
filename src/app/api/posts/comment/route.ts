import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rateLimit';

// Yorumları getir
export async function GET(req: NextRequest) {
  const post_id = req.nextUrl.searchParams.get('post_id');
  if (!post_id) return NextResponse.json({ error: 'post_id gerekli' }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('post_comments')
    .select('id, content, created_at, profiles(username)')
    .eq('post_id', post_id)
    .order('created_at', { ascending: true })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// Yorum ekle
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 });

  if (!checkRateLimit(`comment:${user.id}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Çok hızlı yorum yapıyorsun.' }, { status: 429 });
  }

  const { post_id, content } = await req.json();
  if (!post_id || !content?.trim()) return NextResponse.json({ error: 'Eksik veri' }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('post_comments')
    .insert({ post_id, user_id: user.id, content: content.trim().slice(0, 280) })
    .select('id, content, created_at, profiles(username)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
