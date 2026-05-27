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
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          Görevlere dön
        </Link>

        {alreadyWon && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <Trophy size={24} className="text-green-500 shrink-0" />
            <div>
              <p className="font-bold text-green-800">Bu görevi zaten çözdün!</p>
              <p className="text-green-700 text-sm">{quest.points} puan kazandın 🎉</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sol: Fotoğraf + Bilgi */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="relative">
                <img
                  src={quest.photo_url}
                  alt={quest.title}
                  className="w-full aspect-video object-cover"
                />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  {quest.category && (
                    <span
                      className="bg-white/95 backdrop-blur text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                      style={{ color: quest.category.color }}
                    >
                      {quest.category.icon} {quest.category.name}
                    </span>
                  )}
                </div>
                <div className="absolute top-3 right-3">
                  <span
                    className="text-white text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: diff.color }}
                  >
                    {diff.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{quest.title}</h1>
              {quest.region && (
                <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
                  <MapPin size={14} />
                  {quest.region}
                </div>
              )}
              <p className="text-gray-700">{quest.description}</p>

              {quest.hint && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mt-4">
                  <p className="text-blue-700 text-sm">
                    <span className="font-bold">💡 İpucu:</span> {quest.hint}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="bg-orange-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-orange-600 text-xs font-medium mb-1">
                    <Coins size={12} /> ÖDÜL
                  </div>
                  <div className="text-orange-900 font-bold">
                    {quest.points} puan
                    {quest.cash_reward > 0 && (
                      <span className="text-green-600 block text-sm">+ {quest.cash_reward}₺ nakit</span>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium mb-1">
                    <Users size={12} /> İSTATİSTİK
                  </div>
                  <div className="text-gray-900 font-bold text-sm">
                    {quest.total_solved} kişi çözdü<br />
                    {quest.total_attempts} deneme
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sağ: Submission flow */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <QuestSubmissionFlow quest={quest} alreadyWon={alreadyWon} />
          </div>
        </div>
      </main>
    </div>
  );
}
