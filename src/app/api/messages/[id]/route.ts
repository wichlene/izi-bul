import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  const { data: msg } = await admin.from('messages').select('from_user_id').eq('id', id).single();
  if (!msg || msg.from_user_id !== user.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });

  const { error } = await admin.from('messages').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
