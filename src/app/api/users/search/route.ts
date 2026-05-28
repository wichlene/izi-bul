import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 });

  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  const { data } = await supabase
    .from('profiles')
    .select('id, username, total_finds')
    .ilike('username', `%${q}%`)
    .neq('id', user.id)
    .limit(10);

  return NextResponse.json(data || []);
}
