import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const formData = body ? null : await req.formData().catch(() => null);
  const userId = body?.user_id || formData?.get('user_id') as string;
  const isBusinessRaw = body?.is_business ?? formData?.get('is_business');
  const isBusiness = isBusinessRaw === true || isBusinessRaw === 'true';

  if (!userId) return NextResponse.json({ error: 'Eksik alanlar' }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({ is_business: isBusiness })
    .eq('id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (formData) return NextResponse.redirect(new URL('/admin', req.url));
  return NextResponse.json({ ok: true });
}
