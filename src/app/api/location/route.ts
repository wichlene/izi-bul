import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { latitude, longitude } = await req.json();
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return NextResponse.json({ error: 'Invalid coords' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from('live_locations').upsert({
    user_id: user.id,
    latitude,
    longitude,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  await admin.from('live_locations').delete().eq('user_id', user.id);
  return NextResponse.json({ ok: true });
}
