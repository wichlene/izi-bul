import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('posts')
    .select('id, content, created_at, user_id, profiles(username, avatar_url)')
    .eq('quest_id', id)
    .eq('post_type', 'quest_comment')
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: 'Yorum boş olamaz' }, { status: 400 });

  const { data: quest } = await supabase.from('quests').select('id').eq('id', id).single();
  if (!quest) return NextResponse.json({ error: 'Görev bulunamadı' }, { status: 404 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('posts')
    .insert({
      user_id: user.id,
      quest_id: id,
      post_type: 'quest_comment',
      content: content.trim().slice(0, 300),
    })
    .select('id, content, created_at, user_id, profiles(username, avatar_url)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
