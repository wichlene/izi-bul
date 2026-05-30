import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateDistance } from '@/lib/distance';
import { notifyUsers, getFriendIds } from '@/lib/notify';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 });

  const questId = req.nextUrl.searchParams.get('quest_id');
  if (!questId) return NextResponse.json({ error: 'quest_id gerekli' }, { status: 400 });

  const admin = createAdminClient();

  const { data: progress } = await admin
    .from('user_quest_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('quest_id', questId)
    .maybeSingle();

  // Adımlardan correct_answer'ı gizle (cevap sızmasın)
  const { data: steps } = await admin
    .from('quest_steps')
    .select('id, quest_id, step_number, step_type, has_question, has_image, question, target_lat, target_lng, approach_radius_meters, hint, photo_url')
    .eq('quest_id', questId)
    .order('step_number');

  return NextResponse.json({ progress, steps: steps || [] });
}

// Görevi bırak — kullanıcının bu görevdeki ilerlemesini sil (başka göreve geçebilsin)
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 });

  const questId = req.nextUrl.searchParams.get('quest_id');
  if (!questId) return NextResponse.json({ error: 'quest_id gerekli' }, { status: 400 });

  const admin = createAdminClient();
  await admin.from('user_quest_progress')
    .delete()
    .eq('user_id', user.id)
    .eq('quest_id', questId)
    .eq('is_completed', false);

  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 });

  const { quest_id, step_number, answer, latitude, longitude, photo_url } = await req.json();
  const admin = createAdminClient();

  const { data: step } = await admin
    .from('quest_steps')
    .select('*')
    .eq('quest_id', quest_id)
    .eq('step_number', step_number)
    .single();

  if (!step) return NextResponse.json({ error: 'Adım bulunamadı' }, { status: 404 });

  const { data: quest } = await admin
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

  // Soru kontrolü
  if (step.has_question && step.correct_answer) {
    const norm = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9ğüşöçı]/gi, '');
    if (norm(answer || '') !== norm(step.correct_answer)) {
      return NextResponse.json({ correct: false, message: 'Yanlış cevap, tekrar dene.' });
    }
  }

  // Fotoğraf kontrolü — adım resim gerektiriyorsa fotoğraf zorunlu
  if (step.has_image && !photo_url) {
    return NextResponse.json({ correct: false, message: 'Fotoğraf gerekli.' });
  }

  // İlerleme durumu
  const { data: existingProgress } = await admin
    .from('user_quest_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('quest_id', quest_id)
    .maybeSingle();

  const { data: allSteps } = await admin
    .from('quest_steps')
    .select('step_number')
    .eq('quest_id', quest_id)
    .order('step_number');

  const totalSteps = allSteps?.length || 1;
  const isLastStep = step_number >= totalSteps;
  const nextStep = step_number + 1;

  if (existingProgress) {
    await admin.from('user_quest_progress').update({
      current_step: isLastStep ? step_number : nextStep,
      is_completed: isLastStep,
      completed_at: isLastStep ? new Date().toISOString() : null,
      last_activity_at: new Date().toISOString(),
    }).eq('id', existingProgress.id);
  } else {
    // TEK AKTİF GÖREV KISITI: bu görevi yeni başlatıyorsa, başka aktif görevi olmamalı
    const { data: otherActive } = await admin
      .from('user_quest_progress')
      .select('quest_id, quests(title)')
      .eq('user_id', user.id)
      .eq('is_completed', false)
      .neq('quest_id', quest_id)
      .limit(1)
      .maybeSingle();

    if (otherActive) {
      const t = (otherActive as { quests?: { title?: string } }).quests?.title;
      return NextResponse.json({
        correct: false,
        blocked: true,
        message: `Aynı anda sadece 1 göreve devam edebilirsin. Önce "${t || 'mevcut görevini'}" bitir veya bırak.`,
        active_quest_id: otherActive.quest_id,
      }, { status: 409 });
    }

    await admin.from('user_quest_progress').insert({
      user_id: user.id,
      quest_id,
      current_step: isLastStep ? step_number : nextStep,
      is_completed: isLastStep,
      completed_at: isLastStep ? new Date().toISOString() : null,
    });
  }

  if (isLastStep) {
    return await completeQuest(admin, { quest, quest_id, user_id: user.id, latitude, longitude, distance, photo_url });
  }

  const { data: nextStepData } = await admin
    .from('quest_steps')
    .select('approach_radius_meters, target_lat, target_lng, step_type, question, hint')
    .eq('quest_id', quest_id)
    .eq('step_number', nextStep)
    .single();

  return NextResponse.json({
    correct: true,
    is_complete: false,
    next_step: nextStep,
    next_radius: nextStepData?.approach_radius_meters,
    message: 'Doğru! Sonraki adıma geç.',
  });
}

async function completeQuest(
  admin: ReturnType<typeof createAdminClient>,
  { quest, quest_id, user_id, latitude, longitude, distance, photo_url }: {
    quest: { id: string; title: string; points: number; cash_reward: number; is_active: boolean };
    quest_id: string;
    user_id: string;
    latitude: number;
    longitude: number;
    distance: number;
    photo_url?: string | null;
  }
) {
  // Yarış modu: başka biri önce tamamladıysa reddet
  if (!quest.is_active) {
    return NextResponse.json({
      correct: false,
      message: 'Üzgünüm, başka bir oyuncu bu görevi önce tamamladı! 🏁',
    });
  }

  const earnedPoints = quest.points || 0;
  const earnedCash = quest.cash_reward || 0;

  const { data: profile } = await admin.from('profiles').select('username, total_finds, total_wins, total_cash_earned').eq('id', user_id).single();
  if (profile) {
    await admin.from('profiles').update({
      total_finds: (profile.total_finds || 0) + 1,
      total_wins: (profile.total_wins || 0) + 1,
      total_cash_earned: (profile.total_cash_earned || 0) + earnedCash,
    }).eq('id', user_id);
  }

  await admin.from('submissions').insert({
    quest_id,
    user_id,
    latitude,
    longitude,
    distance_meters: Math.round(distance),
    photo_url: photo_url || null,
    status: 'approved',
    is_winner: true,
    points_earned: earnedPoints,
  });

  // Görevi kapat — ilk kazanan aldı
  await admin.from('quests').update({ is_active: false }).eq('id', quest_id);

  // Sosyal post
  await admin.from('posts').insert({
    user_id,
    quest_id,
    post_type: 'quest_complete',
    content: `@${profile?.username} "${quest.title}" görevini kazandı! 🏆`,
  });

  // Arkadaşlara bildirim
  const friendIds = await getFriendIds(user_id);
  if (friendIds.length) {
    await notifyUsers({
      user_ids: friendIds,
      type: 'quest_complete',
      title: `@${profile?.username} bir görevi kazandı! 🏆`,
      body: `"${quest.title}" görevini tamamladı`,
      actor_id: user_id,
      actor_username: profile?.username,
      link: '/dashboard',
    });
  }

  return NextResponse.json({
    correct: true,
    is_complete: true,
    message: 'Tebrikler! Görevi tamamladın! 🎉',
    cash_reward: earnedCash,
    points: earnedPoints,
    coop_count: 1,
  });
}
