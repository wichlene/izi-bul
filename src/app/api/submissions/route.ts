import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateDistance } from '@/lib/distance';
import { checkRateLimit } from '@/lib/rateLimit';
import { isValidCoord, isInTurkey } from '@/lib/validateCoords';
import { sendEmail, ADMIN_EMAIL } from '@/lib/email';
import { verifyPhotoMatch } from '@/lib/aiVerify';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 });

  // Rate limit: kullanıcı başına 10 submission / dakika
  if (!checkRateLimit(`sub:${user.id}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Çok fazla deneme. Bir dakika bekle.' }, { status: 429 });
  }

  const body = await req.json();
  const { quest_id, latitude, longitude, photo_url } = body;

  if (!quest_id || latitude == null || longitude == null) {
    return NextResponse.json({ error: 'Eksik alanlar' }, { status: 400 });
  }

  // Koordinat doğrulama
  if (!isValidCoord(latitude, longitude)) {
    return NextResponse.json({ error: 'Geçersiz koordinat' }, { status: 400 });
  }
  if (!isInTurkey(latitude, longitude)) {
    return NextResponse.json({ error: 'Konum Türkiye sınırları dışında' }, { status: 400 });
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

  if (quest.expires_at && new Date(quest.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Bu görevin süresi doldu' }, { status: 410 });
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

  let aiMatch = 0;
  let aiReasoning = '';

  if (isClose) {
    if (quest.requires_photo_proof) {
      if (!photo_url) {
        return NextResponse.json({ error: 'Fotoğraf kanıtı gerekli' }, { status: 400 });
      }
      // Yapay zeka ile doğrulama — referans fotoğrafla karşılaştır
      if (quest.photo_url) {
        const aiResult = await verifyPhotoMatch(quest.photo_url, photo_url);
        aiMatch = aiResult.match;
        aiReasoning = aiResult.reasoning;
        if (aiResult.accepted) {
          status = 'auto_won';
          isWinner = true;
          pointsEarned = quest.points;
        } else {
          status = 'pending';
        }
      } else {
        status = 'pending';
      }
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

    // Görev kazanıldı → kapat, haritadan kalksın
    await supabase
      .from('quests')
      .update({
        total_solved: (quest.total_solved || 0) + 1,
        total_attempts: (quest.total_attempts || 0) + 1,
        is_active: false,
      })
      .eq('id', quest_id);

    // Ana akışa kazanma postu ekle
    const admin = createAdminClient();
    const cashText = quest.cash_reward > 0 ? ` +${quest.cash_reward}₺` : '';
    await admin.from('posts').insert({
      user_id: user.id,
      post_type: 'quest_complete',
      content: `"${quest.title}" görevini çözdüm! 🏆 +${pointsEarned} puan${cashText} kazandım.`,
      quest_id: quest_id,
      photo_url: photo_url || null,
      latitude,
      longitude,
    });
  } else {
    await supabase
      .from('quests')
      .update({ total_attempts: (quest.total_attempts || 0) + 1 })
      .eq('id', quest_id);
  }

  // Fotoğraf kanıtı bekleniyorsa admine bildir
  if (status === 'pending') {
    const { data: sender } = await supabase.from('profiles').select('username').eq('id', user.id).single();
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: '📍 Yeni onay bekleyen submission',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0a0a0f;color:#fff;padding:32px;border-radius:16px">
          <h2 style="color:#eab308;margin-bottom:8px">Onay Bekleyen Submission</h2>
          <p style="color:rgba(255,255,255,0.7)"><strong>Kullanıcı:</strong> @${sender?.username || user.id}</p>
          <p style="color:rgba(255,255,255,0.7)"><strong>Görev:</strong> ${quest.title}</p>
          <p style="color:rgba(255,255,255,0.7)"><strong>Mesafe:</strong> ${distance}m</p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://izibul.vercel.app'}/admin" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#ff6b2b;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">Admin Paneline Git</a>
        </div>
      `,
    });
  }

  return NextResponse.json({
    submission,
    distance,
    isClose,
    status,
    isWinner,
    pointsEarned,
    photoRequired: quest.requires_photo_proof,
    aiMatch,
    aiReasoning,
  });
}
