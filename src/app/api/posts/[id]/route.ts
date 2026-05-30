import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 });

  const { id } = await params;
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: 'İçerik boş olamaz' }, { status: 400 });

  const admin = createAdminClient();
  const { data: post } = await admin.from('posts').select('user_id').eq('id', id).single();
  if (!post || post.user_id !== user.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });

  const { data, error } = await admin
    .from('posts')
    .update({ content: content.trim().slice(0, 500) })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();
  const { data: post } = await admin.from('posts').select('user_id').eq('id', id).single();
  if (!post || post.user_id !== user.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });

  const { error } = await admin.from('posts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
