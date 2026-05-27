import Link from 'next/link';
import { MapPin, Plus, Trophy } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import ChallengeCard from '@/components/ChallengeCard';
import { Challenge } from '@/types';

export const revalidate = 30;

async function getChallenges(): Promise<Challenge[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('challenges')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    return data || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const challenges = await getChallenges();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-orange-500 text-white rounded-xl p-1.5">
              <MapPin size={20} />
            </div>
            <span className="text-xl font-bold text-gray-900">İzi Bul</span>
          </Link>
          <Link
            href="/create"
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={16} />
            Konum Yayınla
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="max-w-5xl mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <Trophy size={14} />
            Türkiye&apos;nin ilk konum ödül oyunu
          </div>
          <h1 className="text-4xl font-extrabold mb-3">Konumu bul, ödülü kap!</h1>
          <p className="text-orange-100 text-lg max-w-xl mx-auto">
            Kafeler gizli bir konumdan fotoğraf paylaşıyor. Sen haritada doğru yeri bulursan —
            kahve, indirim veya nakit ödül seni bekliyor.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-8 max-w-lg mx-auto">
            {[
              { step: '1', text: 'Fotoğrafa bak' },
              { step: '2', text: 'Haritada bul' },
              { step: '3', text: 'Ödülü kazan' },
            ].map(({ step, text }) => (
              <div key={step} className="bg-white/20 rounded-xl p-3">
                <div className="text-2xl font-black">{step}</div>
                <div className="text-sm font-medium text-orange-100">{text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Challenge listesi */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Aktif Challengelar
            <span className="ml-2 bg-orange-100 text-orange-600 text-sm font-semibold px-2.5 py-0.5 rounded-full">
              {challenges.length}
            </span>
          </h2>
        </div>

        {challenges.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Henüz aktif challenge yok</h3>
            <p className="text-gray-400 mb-6">İlk konumu sen yayınla!</p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-3 rounded-xl transition-colors"
            >
              <Plus size={18} />
              Konum Yayınla
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {challenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
