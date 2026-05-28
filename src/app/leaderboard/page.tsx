import Link from 'next/link';
import { Trophy, Medal, Crown, Flame } from 'lucide-react';
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
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3" style={{ background: 'rgba(234,179,8,0.15)' }}>
            <Trophy size={28} style={{ color: '#eab308' }} />
          </div>
          <h1 className="text-3xl font-black text-white">Liderlik Tablosu</h1>
          <p className="text-white/30 mt-1 text-sm">En çok puan toplayan kâşifler</p>
        </div>

        {profiles.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-white/20 mb-4">Henüz puan toplayan yok. İlk sen ol!</p>
            <Link
              href="/"
              className="inline-block px-5 py-2.5 rounded-xl font-semibold text-white text-sm"
              style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}
            >
              Görev Bul
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {profiles.map((p, i) => {
              const rank = i + 1;
              const isTop3 = rank <= 3;
              const medal = rank === 1
                ? { icon: <Crown size={18} style={{ color: '#eab308' }} />, bg: 'rgba(234,179,8,0.15)', color: '#eab308' }
                : rank === 2
                ? { icon: <Medal size={18} style={{ color: '#9ca3af' }} />, bg: 'rgba(156,163,175,0.15)', color: '#9ca3af' }
                : { icon: <Medal size={18} style={{ color: '#f97316' }} />, bg: 'rgba(249,115,22,0.15)', color: '#f97316' };

              return (
                <div
                  key={p.id}
                  className="rounded-2xl p-4 flex items-center gap-4 transition-all"
                  style={{
                    background: isTop3 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                    border: isTop3 ? '1px solid rgba(234,179,8,0.15)' : '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                    style={isTop3 ? { background: medal.bg, color: medal.color } : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)' }}>
                    {isTop3 ? medal.icon : rank}
                  </div>

                  <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #ff6b2b, #a855f7)' }}>
                    {p.username.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white truncate">{p.full_name || p.username}</div>
                    <div className="text-white/30 text-xs">@{p.username} · {p.total_finds} görev</div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="font-black text-lg flex items-center gap-1 justify-end" style={{ color: '#ff6b2b' }}>
                      <Flame size={14} />
                      {p.total_points.toLocaleString('tr-TR')}
                    </div>
                    <div className="text-white/20 text-xs">puan</div>
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
