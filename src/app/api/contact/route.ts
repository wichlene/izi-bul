import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// Herkes iletişim/yatırımcı talebi gönderebilir
export async function POST(req: NextRequest) {
  const { name, email, phone, business_name, message, type } = await req.json();
  if (!name || !message) return NextResponse.json({ error: 'İsim ve mesaj zorunlu' }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from('contact_messages').insert({
    name: String(name).slice(0, 120),
    email: email ? String(email).slice(0, 200) : null,
    phone: phone ? String(phone).slice(0, 40) : null,
    business_name: business_name ? String(business_name).slice(0, 160) : null,
    message: String(message).slice(0, 2000),
    type: ['general', 'business', 'investor'].includes(type) ? type : 'general',
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

// Admin: talepleri listele / durum güncelle
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = createAdminClient();
  const { data } = await admin.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(100);
  return NextResponse.json(data || []);
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, status } = await req.json();
  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
  const admin = createAdminClient();
  await admin.from('contact_messages').update({ status }).eq('id', id);
  return NextResponse.json({ ok: true });
}
