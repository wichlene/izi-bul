import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });

  const { type, url } = await req.json();
  if (!['avatar', 'banner'].includes(type)) return NextResponse.json({ error: 'Geçersiz tür' }, { status: 400 });
  if (!url || typeof url !== 'string') return NextResponse.json({ error: 'URL gerekli' }, { status: 400 });

  const field = type === 'avatar' ? 'avatar_url' : 'banner_url';
  const admin = createAdminClient();
  const { error } = await admin.from('profiles').update({ [field]: url }).eq('id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
