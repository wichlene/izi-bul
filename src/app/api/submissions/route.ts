import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateDistance } from '@/lib/distance';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 });

  const body = await req.json();
  const { quest_id, latitude, longitude, photo_url } = body;

  if (!quest_id || latitude == null || longitude == null) {
    return NextResponse.json({ error: 'Eksik alanlar' }, { status: 400 });
  }

  const { data: quest, error: questError } = await supabase
    .from('quests')
    .select('*')
    .eq('id', quest_id)
    .eq('is_active', true)
    .single();

  if (questError || !quest) {
    return NextResponse.json({ error: 'Görev bulunamadı veya sona erdi' }, { status: 404 });
  }

  // Kullanıcı zaten kazandı mı?
  const { data: existing } = await supabase
    .from('submissions')
    .select('id')
    .eq('quest_id', quest_id)
    .eq('user_id', user.id)
    .eq('is_winner', true)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'Bu görevi zaten çözmüşsün!' }, { status: 400 });
  }

  const distance = Math.round(calculateDistance(latitude, longitude, quest.latitude, quest.longitude));
  const isClose = distance <= quest.max_distance_meters;

  let status: 'pending' | 'auto_won' | 'rejected' = 'rejected';
  let isWinner = false;
  let pointsEarned = 0;

  if (isClose) {
    if (quest.requires_photo_proof) {
      if (!photo_url) {
        return NextResponse.json({ error: 'Fotoğraf kanıtı gerekli' }, { status: 400 });
      }
      status = 'pending';
    } else {
      status = 'auto_won';
      isWinner = true;
      pointsEarned = quest.points;
    }
  }

  const { data: submission, error: subError } = await supabase
    .from('submissions')
    .insert({
      quest_id,
      user_id: user.id,
      latitude,
      longitude,
      distance_meters: distance,
      photo_url: photo_url || null,
      status,
      is_winner: isWinner,
      points_earned: pointsEarned,
    })
    .select()
    .single();

  if (subError) return NextResponse.json({ error: subError.message }, { status: 500 });

  // Auto-win: puanı hemen ekle
  if (isWinner) {
    await supabase.rpc('increment_user_points', {
      user_id_in: user.id,
      points_in: pointsEarned,
    }).then(async (r) => {
      // RPC yoksa manuel güncelle
      if (r.error) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('total_points, total_finds')
          .eq('id', user.id)
          .single();
        if (prof) {
          await supabase
            .from('profiles')
            .update({
              total_points: prof.total_points + pointsEarned,
              total_finds: prof.total_finds + 1,
            })
            .eq('id', user.id);
        }
      }
    });

    await supabase
      .from('quests')
      .update({ total_solved: (quest.total_solved || 0) + 1, total_attempts: (quest.total_attempts || 0) + 1 })
      .eq('id', quest_id);
  } else {
    await supabase
      .from('quests')
      .update({ total_attempts: (quest.total_attempts || 0) + 1 })
      .eq('id', quest_id);
  }

  return NextResponse.json({
    submission,
    distance,
    isClose,
    status,
    isWinner,
    pointsEarned,
    photoRequired: quest.requires_photo_proof,
  });
}
