import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Bir kullanıcı ile tüm konuşmayı sil (her iki taraftan gelen dahil)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 });

  const { userId: otherId } = await params;
  const admin = createAdminClient();

  const { error } = await admin
    .from('messages')
    .delete()
    .or(
      `and(from_user_id.eq.${user.id},to_user_id.eq.${otherId}),and(from_user_id.eq.${otherId},to_user_id.eq.${user.id})`
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
