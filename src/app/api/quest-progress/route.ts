import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateDistance } from '@/lib/distance';
import { sendEmail, ADMIN_EMAIL } from '@/lib/email';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 });

  const questId = req.nextUrl.searchParams.get('quest_id');
  if (!questId) return NextResponse.json({ error: 'quest_id gerekli' }, { status: 400 });

  const { data: progress } = await supabase
    .from('user_quest_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('quest_id', questId)
    .maybeSingle();

  const { data: steps } = await supabase
    .from('quest_steps')
    .select('*')
    .eq('quest_id', questId)
    .order('step_number');

  return NextResponse.json({ progress, steps: steps || [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 });

  const { quest_id, step_number, answer, latitude, longitude, photo_url } = await req.json();

  const { data: step } = await supabase
    .from('quest_steps')
    .select('*')
    .eq('quest_id', quest_id)
    .eq('step_number', step_number)
    .single();

  if (!step) return NextResponse.json({ error: 'Adım bulunamadı' }, { status: 404 });

  const { data: quest } = await supabase
    .from('quests')
    .select('*, profiles(username)')
    .eq('id', quest_id)
    .single();

  if (!quest) return NextResponse.json({ error: 'Görev bulunamadı' }, { status: 404 });

  // Konum kontrolü
  const distance = calculateDistance(latitude, longitude, step.target_lat, step.target_lng);
  if (distance > step.approach_radius_meters) {
    return NextResponse.json({
      correct: false,
      message: `Henüz bu adıma çok uzaksın. ${Math.round(distance)}m uzaktasın.`,
      distance: Math.round(distance),
    });
  }

  // Cevap kontrolü (eğer varsa)
  if (step.step_type === 'question' && step.correct_answer) {
    const norm = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9ığüşöçıa-z]/gi, '');
    if (norm(answer || '') !== norm(step.correct_answer)) {
      return NextResponse.json({ correct: false, message: 'Yanlış cevap, tekrar dene.' });
    }
  }

  if (step.step_type === 'image' && !photo_url) {
    return NextResponse.json({ correct: false, message: 'Fotoğraf gerekli.' });
  }

  // Adım tamamlandı — ilerlemeyi kaydet
  const { data: existingProgress } = await supabase
    .from('user_quest_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('quest_id', quest_id)
    .maybeSingle();

  const { data: allSteps } = await supabase
    .from('quest_steps')
    .select('step_number')
    .eq('quest_id', quest_id)
    .order('step_number');

  const totalSteps = allSteps?.length || 1;
  const isLastStep = step_number >= totalSteps;
  const nextStep = step_number + 1;

  if (existingProgress) {
    await supabase.from('user_quest_progress').update({
      current_step: isLastStep ? step_number : nextStep,
      is_completed: isLastStep,
      completed_at: isLastStep ? new Date().toISOString() : null,
      last_activity_at: new Date().toISOString(),
    }).eq('id', existingProgress.id);
  } else {
    await supabase.from('user_quest_progress').insert({
      user_id: user.id,
      quest_id,
      current_step: isLastStep ? step_number : nextStep,
      is_completed: isLastStep,
      completed_at: isLastStep ? new Date().toISOString() : null,
    });
  }

  if (isLastStep) {
    // Görevi tamamla
    await supabase.from('profiles').update({
      total_finds: supabase.rpc as unknown as number,
    });

    const { data: prof } = await supabase.from('profiles').select('total_finds, total_wins').eq('id', user.id).single();
    if (prof) {
      await supabase.from('profiles').update({
        total_finds: prof.total_finds + 1,
        total_wins: (prof.total_wins || 0) + 1,
      }).eq('id', user.id);
    }

    await supabase.from('submissions').insert({
      quest_id,
      user_id: user.id,
      latitude,
      longitude,
      distance_meters: Math.round(distance),
      photo_url: photo_url || null,
      status: 'approved',
      is_winner: true,
      points_earned: quest.points || 0,
    });

    // Sosyal post
    const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
    await supabase.from('posts').insert({
      user_id: user.id,
      quest_id,
      post_type: 'quest_complete',
      content: `@${profile?.username} "${quest.title}" görevini tamamladı! 🎉`,
    });

    // Görevi kapat
    await supabase.from('quests').update({ is_active: false }).eq('id', quest_id);

    return NextResponse.json({
      correct: true,
      is_complete: true,
      message: 'Tebrikler! Görevi tamamladın! 🎉',
      cash_reward: quest.cash_reward,
    });
  }

  const { data: nextStepData } = await supabase
    .from('quest_steps')
    .select('approach_radius_meters, target_lat, target_lng')
    .eq('quest_id', quest_id)
    .eq('step_number', nextStep)
    .single();

  return NextResponse.json({
    correct: true,
    is_complete: false,
    next_step: nextStep,
    next_radius: nextStepData?.approach_radius_meters,
    message: `Doğru! Sonraki adıma geç.`,
  });
}
