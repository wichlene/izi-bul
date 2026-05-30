import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });

  const { full_name, username, city, bio } = await req.json();

  // username benzersizlik kontrolü
  if (username) {
    if (username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json({ error: 'Geçersiz kullanıcı adı' }, { status: 400 });
    }
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .neq('id', user.id)
      .maybeSingle();
    if (existing) return NextResponse.json({ error: 'Bu kullanıcı adı alınmış' }, { status: 409 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from('profiles').update({
    ...(full_name !== undefined && { full_name: full_name.trim().slice(0, 60) }),
    ...(username !== undefined && { username: username.toLowerCase().slice(0, 30) }),
    ...(city !== undefined && { city: city.trim().slice(0, 60) }),
    ...(bio !== undefined && { bio: bio.trim().slice(0, 160) }),
  }).eq('id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
