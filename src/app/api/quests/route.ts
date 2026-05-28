import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DIFFICULTIES, Difficulty } from '@/types';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('quests')
    .select('*, category:categories(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 });

  const body = await req.json();
  const {
    category_id, title, description, photo_url, hint, region,
    latitude, longitude, difficulty, cash_reward, max_distance_meters,
    requires_photo_proof,
  } = body;

  if (!category_id || !title || !description || !photo_url || latitude == null || longitude == null) {
    return NextResponse.json({ error: 'Eksik alanlar' }, { status: 400 });
  }

  const diff = (difficulty || 'medium') as Difficulty;
  const points = DIFFICULTIES[diff]?.points || 100;

  const { data, error } = await supabase
    .from('quests')
    .insert({
      category_id,
      title,
      description,
      photo_url,
      hint,
      region,
      latitude,
      longitude,
      difficulty: diff,
      points,
      cash_reward: cash_reward || 0,
      max_distance_meters: max_distance_meters || 50,
      requires_photo_proof: requires_photo_proof !== false,
      is_active: true,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
