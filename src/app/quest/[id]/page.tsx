import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Coins, Users, Trophy, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Quest, DIFFICULTIES } from '@/types';
import Header from '@/components/Header';
import QuestSubmissionFlow from './QuestSubmissionFlow';

export const revalidate = 0;

async function getQuest(id: string): Promise<{ quest: Quest | null; alreadyWon: boolean }> {
  try {
    const supabase = await createClient();
    const { data: quest } = await supabase
      .from('quests')
      .select('*, category:categories(*)')
      .eq('id', id)
      .single();

    if (!quest) return { quest: null, alreadyWon: false };

    const { data: { user } } = await supabase.auth.getUser();
    let alreadyWon = false;
    if (user) {
      const { data } = await supabase
        .from('submissions')
        .select('id')
        .eq('quest_id', id)
        .eq('user_id', user.id)
        .eq('is_winner', true)
        .maybeSingle();
      alreadyWon = !!data;
    }

    return { quest: quest as Quest, alreadyWon };
  } catch {
    return { quest: null, alreadyWon: false };
  }
}

export default async function QuestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { quest, alreadyWon } = await getQuest(id);
  if (!quest) notFound();

  const diff = DIFFICULTIES[quest.difficulty];

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-white/30 hover:text-white/70 text-sm mb-4 transition-colors"
        >
          <ArrowLeft size={15} />
          Görevlere dön
        </Link>

        {alreadyWon && (
          <div className="rounded-2xl p-4 mb-6 flex items-center gap-3" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <Trophy size={22} style={{ color: '#22c55e' }} className="shrink-0" />
            <div>
              <p className="font-bold text-white">Bu görevi zaten çözdün!</p>
              <p className="text-white/50 text-sm">{quest.points} puan kazandın 🎉</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Sol: Fotoğraf + Bilgi */}
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="relative">
                <img
                  src={quest.photo_url}
                  alt={quest.title}
                  className="w-full aspect-video object-cover"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)' }} />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  {quest.category && (
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur"
                      style={{ background: 'rgba(0,0,0,0.6)', color: quest.category.color, border: `1px solid ${quest.category.color}40` }}
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

            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h1 className="text-2xl font-black text-white mb-2">{quest.title}</h1>
              {quest.region && (
                <div className="flex items-center gap-1.5 text-white/40 text-sm mb-3">
                  <MapPin size={13} />
                  {quest.region}
                </div>
              )}
              <p className="text-white/60 text-sm leading-relaxed">{quest.description}</p>

              {quest.hint && (
                <div className="rounded-xl p-3 mt-4" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <p className="text-blue-400 text-sm">
                    <span className="font-bold">💡 İpucu:</span> {quest.hint}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,107,43,0.08)', border: '1px solid rgba(255,107,43,0.15)' }}>
                  <div className="flex items-center gap-1.5 text-xs font-medium mb-1" style={{ color: '#ff6b2b' }}>
                    <Coins size={11} /> ÖDÜL
                  </div>
                  <div className="font-black text-white">
                    {quest.points} puan
                    {quest.cash_reward > 0 && (
                      <span className="block text-sm" style={{ color: '#22c55e' }}>+ {quest.cash_reward}₺ nakit</span>
                    )}
                  </div>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-1.5 text-white/30 text-xs font-medium mb-1">
                    <Users size={11} /> İSTATİSTİK
                  </div>
                  <div className="font-bold text-white text-sm">
                    {quest.total_solved} kişi çözdü<br />
                    <span className="text-white/40 font-normal">{quest.total_attempts} deneme</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sağ: Submission flow */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <QuestSubmissionFlow quest={quest} alreadyWon={alreadyWon} />
          </div>
        </div>
      </main>
    </div>
  );
}
