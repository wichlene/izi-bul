import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/fromRequest';
import { DIFFICULTIES, Difficulty } from '@/types';

// Zorluğa göre son nokta yakınlık yarıçapı (metre)
const FINAL_RADIUS: Record<Difficulty, number> = {
  easy: 100, medium: 60, hard: 40, legendary: 25,
};

export async function GET() {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('quests')
    .select('*, category:categories(*)')
    .eq('is_active', true)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 });

  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, is_business')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin && !profile?.is_business) {
    return NextResponse.json({ error: 'Görev eklemek için işletme hesabı gerekli' }, { status: 403 });
  }

  const body = await req.json();
  const {
    category_id, title, description, photo_url, hint, region,
    latitude, longitude, difficulty, cash_reward, max_distance_meters,
    requires_photo_proof, expires_at, steps,
  } = body;

  if (!category_id || !title || !description || !photo_url || latitude == null || longitude == null) {
    return NextResponse.json({ error: 'Eksik alanlar' }, { status: 400 });
  }

  const diff = (difficulty || 'medium') as Difficulty;
  const points = DIFFICULTIES[diff]?.points || 100;
  const finalRadius = max_distance_meters || FINAL_RADIUS[diff] || 50;
  const isMultistep = Array.isArray(steps) && steps.length > 0;

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
      max_distance_meters: finalRadius,
      requires_photo_proof: requires_photo_proof !== false,
      is_active: true,
      is_multistep: isMultistep,
      created_by: user.id,
      expires_at: expires_at || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Çok adımlı görev: ara adımlar + son nokta (görev konumu)
  if (isMultistep) {
    const admin = createAdminClient();
    const stepRows = steps.map((s: {
      has_question?: boolean;
      has_image?: boolean;
      question?: string;
      correct_answer?: string;
      reference_photo_url?: string;
      approach_radius_meters?: number;
      hint?: string;
    }, i: number) => ({
      quest_id: data.id,
      step_number: i + 1,
      step_type: s.has_question && s.has_image ? 'combo' : s.has_question ? 'question' : 'image',
      has_question: s.has_question || false,
      has_image: s.has_image || false,
      question: s.question || null,
      correct_answer: s.correct_answer || null,
      photo_url: s.reference_photo_url || null,
      target_lat: latitude,
      target_lng: longitude,
      approach_radius_meters: (s.approach_radius_meters ?? 0) > 0 ? s.approach_radius_meters! : 400,
      hint: s.hint || null,
    }));
    // Son adım: görevin gizli konumu (zorluğa göre dar yarıçap)
    stepRows.push({
      quest_id: data.id,
      step_number: steps.length + 1,
      step_type: 'final',
      has_question: false,
      has_image: true,
      question: null,
      correct_answer: null,
      photo_url: photo_url || null,
      target_lat: latitude,
      target_lng: longitude,
      approach_radius_meters: finalRadius,
      hint: hint || null,
    });
    const { error: stepErr } = await admin.from('quest_steps').insert(stepRows);
    if (stepErr) return NextResponse.json({ error: 'Adımlar kaydedilemedi: ' + stepErr.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
