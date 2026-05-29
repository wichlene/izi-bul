import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Coins, Users, Trophy, MapPin } from 'lucide-react';
import ShareButtons from './ShareButtons';
import { createClient } from '@/lib/supabase/server';
import { Quest, DIFFICULTIES } from '@/types';
import Header from '@/components/Header';
import QuestPlay from './QuestPlay';

export const revalidate = 0;

interface QuestStep {
  id: string;
  step_number: number;
  step_type: 'question' | 'location' | 'image' | 'final';
  question: string | null;
  target_lat: number;
  target_lng: number;
  approach_radius_meters: number;
  hint: string | null;
}

async function getQuest(id: string): Promise<{
  quest: Quest | null; alreadyWon: boolean; isLoggedIn: boolean; steps: QuestStep[]; initialStep: number;
}> {
  try {
    const supabase = await createClient();
    const { data: quest } = await supabase
      .from('quests')
      .select('*, category:categories(*)')
      .eq('id', id)
      .single();

    if (!quest) return { quest: null, alreadyWon: false, isLoggedIn: false, steps: [], initialStep: 1 };

    const { data: { user } } = await supabase.auth.getUser();
    let alreadyWon = false;
    let initialStep = 1;
    if (user) {
      const { data } = await supabase
        .from('submissions')
        .select('id')
        .eq('quest_id', id)
        .eq('user_id', user.id)
        .eq('is_winner', true)
        .maybeSingle();
      alreadyWon = !!data;

      const { data: progress } = await supabase
        .from('user_quest_progress')
        .select('current_step, is_completed')
        .eq('quest_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (progress && !progress.is_completed) initialStep = progress.current_step;
      if (progress?.is_completed) alreadyWon = true;
    }

    const { data: steps } = await supabase
      .from('quest_steps')
      .select('id, step_number, step_type, question, target_lat, target_lng, approach_radius_meters, hint')
      .eq('quest_id', id)
      .order('step_number');

    return { quest: quest as Quest, alreadyWon, isLoggedIn: !!user, steps: (steps as QuestStep[]) || [], initialStep };
  } catch {
    return { quest: null, alreadyWon: false, isLoggedIn: false, steps: [], initialStep: 1 };
  }
}

export default async function QuestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { quest, alreadyWon, isLoggedIn, steps, initialStep } = await getQuest(id);
  if (!quest) notFound();
  const questUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://izibul.vercel.app'}/quest/${id}`;

  const diff = DIFFICULTIES[quest.difficulty];

  return (
    <div className="min-h-screen" style={{ background: '#f7f8f8' }}>
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm mb-4 transition-colors hover:opacity-70"
          style={{ color: '#536471' }}
        >
          <ArrowLeft size={15} />
          Görevlere dön
        </Link>

        {alreadyWon && (
          <div className="rounded-2xl p-4 mb-6 flex items-center gap-3" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <Trophy size={22} style={{ color: '#22c55e' }} className="shrink-0" />
            <div>
              <p className="font-bold" style={{ color: '#0f1419' }}>Bu görevi zaten çözdün!</p>
              <p className="text-sm" style={{ color: '#536471' }}>{quest.points} puan kazandın 🎉</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Sol: Fotoğraf + Bilgi */}
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #eff3f4' }}>
              <div className="relative">
                <img
                  src={quest.photo_url}
                  alt={quest.title}
                  className="w-full aspect-video object-cover"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)' }} />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  {quest.category && (
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur"
                      style={{ background: 'rgba(0,0,0,0.55)', color: quest.category.color, border: `1px solid ${quest.category.color}40` }}
                    >
                      {quest.category.icon} {quest.category.name}
                    </span>
                  )}
                </div>
                <div className="absolute top-3 right-3">
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: diff.color + '30', color: diff.color, border: `1px solid ${diff.color}40` }}
                  >
                    {diff.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: '#ffffff', border: '1px solid #eff3f4' }}>
              <h1 className="text-2xl font-black mb-2" style={{ color: '#0f1419' }}>{quest.title}</h1>
              {quest.region && (
                <div className="flex items-center gap-1.5 text-sm mb-3" style={{ color: '#536471' }}>
                  <MapPin size={13} />
                  {quest.region}
                </div>
              )}
              <p className="text-sm leading-relaxed" style={{ color: '#536471' }}>{quest.description}</p>

              {quest.hint && (
                <div className="rounded-xl p-3 mt-4" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                  <p className="text-blue-600 text-sm">
                    <span className="font-bold">💡 İpucu:</span> {quest.hint}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,107,43,0.06)', border: '1px solid rgba(255,107,43,0.15)' }}>
                  <div className="flex items-center gap-1.5 text-xs font-medium mb-1" style={{ color: '#ff6b2b' }}>
                    <Coins size={11} /> ÖDÜL
                  </div>
                  <div className="font-black" style={{ color: '#0f1419' }}>
                    {quest.points} puan
                    {quest.cash_reward > 0 && (
                      <span className="block text-sm" style={{ color: '#22c55e' }}>+ {quest.cash_reward}₺ nakit</span>
                    )}
                  </div>
                </div>
                <div className="rounded-xl p-3" style={{ background: '#f7f8f8', border: '1px solid #eff3f4' }}>
                  <div className="flex items-center gap-1.5 text-xs font-medium mb-1" style={{ color: '#536471' }}>
                    <Users size={11} /> İSTATİSTİK
                  </div>
                  <div className="font-bold text-sm" style={{ color: '#0f1419' }}>
                    {quest.total_solved} kişi çözdü<br />
                    <span className="font-normal" style={{ color: '#536471' }}>{quest.total_attempts} deneme</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sağ: Submission flow + Paylaş */}
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #eff3f4' }}>
              <QuestPlay quest={quest} alreadyWon={alreadyWon} isLoggedIn={isLoggedIn} steps={steps} initialStep={initialStep} />
            </div>
            <ShareButtons questTitle={quest.title} questUrl={questUrl} />
          </div>
        </div>
      </main>
    </div>
  );
}
