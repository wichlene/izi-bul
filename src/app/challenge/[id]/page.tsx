import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Gift, Users, Trophy } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Challenge } from '@/types';
import GuessMap from './GuessMap';

async function getChallenge(id: string): Promise<Challenge | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', id)
      .single();
    return data;
  } catch {
    return null;
  }
}

export default async function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const challenge = await getChallenge(id);
  if (!challenge) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="bg-orange-500 text-white rounded-xl p-1.5">
              <MapPin size={18} />
            </div>
            <span className="text-lg font-bold text-gray-900">İzi Bul</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {!challenge.is_active && challenge.winner_name && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <Trophy size={24} className="text-yellow-500 shrink-0" />
            <div>
              <p className="font-bold text-yellow-800">Bu challenge sona erdi!</p>
              <p className="text-yellow-700 text-sm">
                Kazanan: <span className="font-semibold">{challenge.winner_name}</span>
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sol: Fotoğraf + Bilgi */}
          <div className="space-y-4">
            {/* Fotoğraf */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="relative">
                <img
                  src={challenge.photo_url}
                  alt="Challenge konumu"
                  className="w-full aspect-video object-cover"
                />
                {challenge.is_active && (
                  <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    Aktif
                  </div>
                )}
              </div>
            </div>

            {/* Kafe bilgisi */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 text-orange-500 font-semibold mb-2">
                <MapPin size={16} />
                <span>{challenge.cafe_name}</span>
              </div>
              <p className="text-gray-700 mb-4">{challenge.description}</p>

              {challenge.hint && (
                <div className="bg-blue-50 rounded-xl p-3 mb-4">
                  <p className="text-blue-700 text-sm">
                    <span className="font-semibold">İpucu:</span> {challenge.hint}
                  </p>
                </div>
              )}

              {/* Ödül */}
              <div className="bg-orange-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-orange-600 font-semibold mb-1">
                  <Gift size={16} />
                  Ödül
                </div>
                <p className="text-orange-800 font-bold text-lg">{challenge.reward}</p>
                {challenge.reward_type === 'cash' && challenge.reward_amount && (
                  <p className="text-orange-600 text-sm">{challenge.reward_amount}₺ nakit</p>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-gray-400 text-sm mt-3">
                <Users size={14} />
                <span>{challenge.total_guesses} kişi tahmin yaptı</span>
              </div>
            </div>
          </div>

          {/* Sağ: Harita + Tahmin */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Konumu Haritada İşaretle</h2>
              <p className="text-gray-500 text-sm mt-0.5">
                Haritaya tıkla, pin bırak, adını yaz ve tahmin et!
              </p>
            </div>
            <GuessMap challenge={challenge} />
          </div>
        </div>
      </main>
    </div>
  );
}
