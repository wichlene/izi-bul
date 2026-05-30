import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 1) return NextResponse.json([]);

  const admin = createAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('id, username')
    .ilike('username', `${q}%`)
    .limit(6);

  return NextResponse.json(data || []);
}
