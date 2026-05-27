import Link from 'next/link';
import { Trophy, Medal, Crown } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/Header';
import { Profile } from '@/types';

export const revalidate = 60;

async function getLeaderboard(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('total_points', { ascending: false })
    .limit(50);
  return data || [];
}

export default async function LeaderboardPage() {
  const profiles = await getLeaderboard();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 text-yellow-500 rounded-full mb-3">
            <Trophy size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Liderlik Tablosu</h1>
          <p className="text-gray-500 mt-1">En çok puan toplayan kâşifler</p>
        </div>

        {profiles.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-400 border border-gray-100">
            Henüz puan toplayan yok. İlk sen ol!
            <Link
              href="/"
              className="block mt-4 mx-auto w-fit bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2.5 rounded-xl transition-colors"
            >
              Görev Bul
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {profiles.map((p, i) => {
              const rank = i + 1;
              const icon = rank === 1 ? <Crown size={20} className="text-yellow-500" />
                          : rank === 2 ? <Medal size={20} className="text-gray-400" />
                          : rank === 3 ? <Medal size={20} className="text-orange-400" />
                          : null;
              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-4 ${
                    rank <= 3 ? 'border-yellow-200' : 'border-gray-100'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                    rank === 2 ? 'bg-gray-100 text-gray-700' :
                    rank === 3 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-50 text-gray-500'
                  }`}>
                    {icon || rank}
                  </div>
                  <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold">
                    {p.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 truncate">
                      {p.full_name || p.username}
                    </div>
                    <div className="text-xs text-gray-400">
                      @{p.username} · {p.total_finds} görev
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-extrabold text-orange-500">
                      {p.total_points.toLocaleString('tr-TR')}
                    </div>
                    <div className="text-xs text-gray-400">puan</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
