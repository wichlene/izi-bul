import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateDistance } from '@/lib/distance';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { challenge_id, user_name, latitude, longitude } = body;

  if (!challenge_id || !user_name || latitude == null || longitude == null) {
    return NextResponse.json({ error: 'Eksik alanlar' }, { status: 400 });
  }

  const supabase = await createClient();

  // Challenge bilgisini al
  const { data: challenge, error: challengeError } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', challenge_id)
    .eq('is_active', true)
    .single();

  if (challengeError || !challenge) {
    return NextResponse.json({ error: 'Challenge bulunamadı veya sona erdi' }, { status: 404 });
  }

  // Mesafe hesapla
  const distance = calculateDistance(latitude, longitude, challenge.latitude, challenge.longitude);
  const isWinner = distance <= challenge.max_distance_meters;

  // Tahmini kaydet
  const { data: guess, error: guessError } = await supabase
    .from('guesses')
    .insert({
      challenge_id,
      user_name,
      latitude,
      longitude,
      distance_meters: Math.round(distance),
      is_winner: isWinner,
    })
    .select()
    .single();

  if (guessError) return NextResponse.json({ error: guessError.message }, { status: 500 });

  // Kazanan bulduysa challenge'ı kapat
  if (isWinner) {
    await supabase
      .from('challenges')
      .update({
        is_active: false,
        winner_id: guess.id,
        winner_name: user_name,
      })
      .eq('id', challenge_id);
  } else {
    // Tahmin sayısını artır
    await supabase
      .from('challenges')
      .update({ total_guesses: (challenge.total_guesses || 0) + 1 })
      .eq('id', challenge_id);
  }

  return NextResponse.json({
    isWinner,
    distance: Math.round(distance),
    guess,
    reward: isWinner ? challenge.reward : null,
  });
}
