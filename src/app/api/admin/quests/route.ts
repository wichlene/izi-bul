import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { quest_id, is_active } = await req.json();
  if (!quest_id) return NextResponse.json({ error: 'quest_id gerekli' }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from('quests').update({ is_active: !!is_active }).eq('id', quest_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// Görevi kalıcı sil (ilişkili kayıtlarla birlikte)
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const questId = req.nextUrl.searchParams.get('id');
  if (!questId) return NextResponse.json({ error: 'id gerekli' }, { status: 400 });

  const admin = createAdminClient();

  // Bağlı kayıtları temizle (FK varsa cascade olmayabilir)
  await admin.from('submissions').delete().eq('quest_id', questId);
  await admin.from('user_quest_progress').delete().eq('quest_id', questId);
  await admin.from('quest_steps').delete().eq('quest_id', questId);
  await admin.from('posts').delete().eq('quest_id', questId);

  const { error } = await admin.from('quests').delete().eq('id', questId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
