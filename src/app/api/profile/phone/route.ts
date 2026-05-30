import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });

  const { phone } = await req.json();
  if (!phone || !/^05\d{9}$/.test(phone)) {
    return NextResponse.json({ error: 'Geçersiz telefon' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({ phone })
    .eq('id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
