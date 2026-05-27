import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { cafe_name, description, photo_url, hint, latitude, longitude, reward, reward_type, reward_amount, max_distance_meters, expires_at } = body;

  if (!cafe_name || !description || !photo_url || latitude == null || longitude == null || !reward) {
    return NextResponse.json({ error: 'Eksik alanlar var' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('challenges')
    .insert({
      cafe_name,
      description,
      photo_url,
      hint,
      latitude,
      longitude,
      reward,
      reward_type: reward_type || 'product',
      reward_amount,
      max_distance_meters: max_distance_meters || 150,
      expires_at,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
