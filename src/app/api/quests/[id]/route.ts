import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('quests')
    .select('*, category:categories(*)')
    .eq('id', id)
    .single();
  if (error) return NextResponse.json({ error: 'Görev bulunamadı' }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: 'Yalnızca adminler görev silebilir' }, { status: 403 });

  const { error } = await admin.from('quests').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidateTag('quests');
  return NextResponse.json({ ok: true });
}
