import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { BarChart2, Users, Target, Trophy, Clock, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';

export default async function BusinessStatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, is_business, business_name, username')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin && !profile?.is_business) redirect('/');

  const { data: quests } = await supabase
    .from('quests')
    .select('id, title, total_attempts, total_solved, cash_reward, is_active, created_at, expires_at')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false });

  const questIds = (quests || []).map((q) => q.id);
  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, status, created_at, distance_meters, quest_id, is_winner, points_earned, user:profiles!submissions_user_id_fkey(username)')
    .in('quest_id', questIds)
    .order('created_at', { ascending: false })
    .limit(100);

  const totalAttempts = quests?.reduce((s, q) => s + (q.total_attempts || 0), 0) || 0;
  const totalSolved = quests?.reduce((s, q) => s + (q.total_solved || 0), 0) || 0;
  const totalReward = quests?.reduce((s, q) => s + (q.cash_reward || 0), 0) || 0;
  const pendingCount = submissions?.filter((s) => s.status === 'pending').length || 0;
  const winners = (submissions || []).filter(s => s.is_winner).slice(0, 10);
  const convRate = totalAttempts > 0 ? Math.round((totalSolved / totalAttempts) * 100) : 0;

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-white/30 hover:text-white/60 text-sm mb-6 transition-colors">
          <ArrowLeft size={14} /> Geri
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,107,43,0.2)' }}>
            <BarChart2 size={24} style={{ color: '#ff6b2b' }} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">İşletme İstatistikleri</h1>
            <p className="text-white/30 text-sm">
              {profile?.business_name || `@${profile?.username}`}
            </p>
          </div>
        </div>

        {/* Özet kartlar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Target size={20} />, val: quests?.length || 0, label: 'Toplam Görev', color: '#ff6b2b' },
            { icon: <Users size={20} />, val: totalAttempts, label: 'Toplam Deneme', color: '#a855f7' },
            { icon: <Trophy size={20} />, val: totalSolved, label: 'Bulan Kişi', color: '#22c55e' },
            { icon: <Clock size={20} />, val: pendingCount, label: 'Onay Bekleyen', color: '#eab308' },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-5 border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: s.color + '20', color: s.color }}>
                {s.icon}
              </div>
              <div className="text-3xl font-black text-white">{s.val.toLocaleString('tr-TR')}</div>
              <div className="text-white/40 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Dönüşüm Hunisi */}
        <div className="rounded-2xl border border-white/5 p-5 mb-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <h2 className="font-bold text-white mb-4">Dönüşüm Hunisi</h2>
          <div className="space-y-3">
            {[
              { label: 'Toplam Deneme', value: totalAttempts, pct: 100, color: '#ff6b2b' },
              { label: 'Bölgeye Ulaşan', value: Math.round(totalAttempts * 0.4), pct: 40, color: '#a855f7' },
              { label: 'Görevi Bulan', value: totalSolved, pct: totalAttempts > 0 ? Math.round((totalSolved / totalAttempts) * 100) : 0, color: '#22c55e' },
            ].map(row => (
              <div key={row.label}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-white/60">{row.label}</span>
                  <span className="font-bold text-white">{row.value.toLocaleString('tr-TR')} <span className="text-white/30 font-normal">({row.pct}%)</span></span>
                </div>
                <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-2 rounded-full transition-all" style={{ width: `${row.pct}%`, background: row.color }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-white/20 text-xs mt-4">Genel dönüşüm oranı: <span className="text-white/50 font-bold">%{convRate}</span></p>
        </div>

        {/* Son Kazananlar */}
        {winners.length > 0 && (
          <div className="rounded-2xl border border-white/5 overflow-hidden mb-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
              <Trophy size={16} style={{ color: '#ffd700' }} />
              <h2 className="font-bold text-white">Son Kazananlar</h2>
            </div>
            <div className="divide-y divide-white/5">
              {winners.map((s) => {
                const u = Array.isArray(s.user) ? s.user[0] : s.user;
                const quest = quests?.find(q => q.id === s.quest_id);
                return (
                  <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm text-white"
                      style={{ background: 'linear-gradient(135deg,#ff6b2b,#a855f7)' }}>
                      {(u?.username || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">@{u?.username || 'anonim'}</p>
                      <p className="text-xs text-white/30 truncate">{quest?.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/40">{new Date(s.created_at).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Görev tablosu */}
        <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="font-bold text-white">Görevlerim</h2>
          </div>
          {!quests?.length ? (
            <div className="p-10 text-center text-white/20">
              <p>Henüz görev yok.</p>
              <Link href="/quest/create" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}>
                İlk Görevi Ekle
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Görev', 'Deneme', 'Bulan', 'Ödül', 'Durum', ''].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-white/30 font-medium text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {quests.map((q) => {
                    const solveRate = q.total_attempts > 0 ? Math.round((q.total_solved / q.total_attempts) * 100) : 0;
                    const isExpired = q.expires_at && new Date(q.expires_at) < new Date();
                    return (
                      <tr key={q.id} className="hover:bg-white/2 transition-colors">
                        <td className="px-5 py-3">
                          <div className="text-white font-medium">{q.title}</div>
                          <div className="text-white/30 text-xs mt-0.5">
                            {new Date(q.created_at).toLocaleDateString('tr-TR')}
                            {q.expires_at && (
                              <span className="ml-2">· Bitiş: {new Date(q.expires_at).toLocaleDateString('tr-TR')}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-white/60">{q.total_attempts}</td>
                        <td className="px-5 py-3">
                          <span className="text-white/60">{q.total_solved}</span>
                          {q.total_attempts > 0 && (
                            <span className="text-white/20 text-xs ml-1">({solveRate}%)</span>
                          )}
                        </td>
                        <td className="px-5 py-3 font-bold" style={{ color: q.cash_reward > 0 ? '#22c55e' : 'rgba(255,255,255,0.2)' }}>
                          {q.cash_reward > 0 ? `${q.cash_reward}₺` : '-'}
                        </td>
                        <td className="px-5 py-3">
                          {isExpired ? (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>Sona Erdi</span>
                          ) : q.is_active ? (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.2)', color: '#22c55e' }}>Aktif</span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}>Pasif</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <Link href={`/quest/${q.id}`} className="text-white/30 hover:text-white text-xs transition-colors">
                            Gör →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
