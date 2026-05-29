import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const questId = body?.quest_id;
  const featured = body?.featured === true || body?.featured === 'true';

  if (!questId) return NextResponse.json({ error: 'Missing quest_id' }, { status: 400 });

  const admin = createAdminClient();
  await admin.from('quests').update({ is_featured: featured }).eq('id', questId);
  return NextResponse.json({ ok: true });
}
