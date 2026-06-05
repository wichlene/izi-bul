import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { BarChart2, Users, Target, Trophy, Clock, ArrowLeft } from 'lucide-react';
import AppShell from '@/components/AppShell';

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
    .select('id, status, created_at, distance_meters, quest_id, is_winner, points_earned, user:profiles!submissions_user_id_fkey(id, username)')
    .in('quest_id', questIds.length ? questIds : ['none'])
    .order('created_at', { ascending: false })
    .limit(100);

  const totalAttempts = quests?.reduce((s, q) => s + (q.total_attempts || 0), 0) || 0;
  const totalSolved = quests?.reduce((s, q) => s + (q.total_solved || 0), 0) || 0;
  const pendingCount = submissions?.filter((s) => s.status === 'pending').length || 0;
  const winners = (submissions || []).filter(s => s.is_winner).slice(0, 10);
  const convRate = totalAttempts > 0 ? Math.round((totalSolved / totalAttempts) * 100) : 0;

  const card = { background: '#ffffff', border: '1px solid #eff3f4' };

  return (
    <AppShell>
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors hover:opacity-70" style={{ color: '#536471' }}>
          <ArrowLeft size={14} /> Geri
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,107,43,0.1)', border: '1px solid rgba(255,107,43,0.15)' }}>
            <BarChart2 size={24} style={{ color: '#ff6b2b' }} />
          </div>
          <div>
            <h1 className="text-2xl font-black" style={{ color: '#0f1419' }}>İşletme İstatistikleri</h1>
            <p className="text-sm" style={{ color: '#536471' }}>
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
            <div key={i} className="rounded-2xl p-5" style={card}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: s.color + '15', color: s.color }}>
                {s.icon}
              </div>
              <div className="text-3xl font-black" style={{ color: '#0f1419' }}>{s.val.toLocaleString('tr-TR')}</div>
              <div className="text-sm mt-1" style={{ color: '#536471' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Dönüşüm Hunisi */}
        <div className="rounded-2xl p-5 mb-6" style={card}>
          <h2 className="font-bold mb-4" style={{ color: '#0f1419' }}>Dönüşüm Hunisi</h2>
          <div className="space-y-3">
            {[
              { label: 'Toplam Deneme', value: totalAttempts, pct: 100, color: '#ff6b2b' },
              { label: 'Bölgeye Ulaşan', value: Math.round(totalAttempts * 0.4), pct: 40, color: '#a855f7' },
              { label: 'Görevi Bulan', value: totalSolved, pct: totalAttempts > 0 ? Math.round((totalSolved / totalAttempts) * 100) : 0, color: '#22c55e' },
            ].map(row => (
              <div key={row.label}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span style={{ color: '#536471' }}>{row.label}</span>
                  <span className="font-bold" style={{ color: '#0f1419' }}>{row.value.toLocaleString('tr-TR')} <span style={{ color: '#8e9aab' }}>({row.pct}%)</span></span>
                </div>
                <div className="h-2 rounded-full" style={{ background: '#f0f2f4' }}>
                  <div className="h-2 rounded-full transition-all" style={{ width: `${row.pct}%`, background: row.color }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs mt-4" style={{ color: '#8e9aab' }}>Genel dönüşüm oranı: <span className="font-bold" style={{ color: '#0f1419' }}>%{convRate}</span></p>
        </div>

        {/* Son Kazananlar */}
        {winners.length > 0 && (
          <div className="rounded-2xl overflow-hidden mb-6" style={card}>
            <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #eff3f4' }}>
              <Trophy size={16} style={{ color: '#eab308' }} />
              <h2 className="font-bold" style={{ color: '#0f1419' }}>Son Kazananlar</h2>
            </div>
            <div>
              {winners.map((s) => {
                const u = Array.isArray(s.user) ? s.user[0] : s.user;
                const quest = quests?.find(q => q.id === s.quest_id);
                return (
                  <div key={s.id} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: '1px solid #eff3f4' }}>
                    <Link href={`/user/${(u as { id?: string })?.id || '#'}`}
                      className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#ff6b2b,#a855f7)' }}>
                      {((u as { username?: string })?.username || '?').charAt(0).toUpperCase()}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/user/${(u as { id?: string })?.id || '#'}`} className="text-sm font-bold hover:underline" style={{ color: '#0f1419' }}>
                        @{(u as { username?: string })?.username || 'anonim'}
                      </Link>
                      <p className="text-xs truncate" style={{ color: '#536471' }}>{quest?.title}</p>
                    </div>
                    <p className="text-xs" style={{ color: '#8e9aab' }}>{new Date(s.created_at).toLocaleDateString('tr-TR')}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Görev tablosu */}
        <div className="rounded-2xl overflow-hidden" style={card}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #eff3f4' }}>
            <h2 className="font-bold" style={{ color: '#0f1419' }}>Görevlerim</h2>
          </div>
          {!quests?.length ? (
            <div className="p-10 text-center" style={{ color: '#536471' }}>
              <p>Henüz görev yok.</p>
              <Link href="/quest/create" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}>
                İlk Görevi Ekle
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #eff3f4' }}>
                    {['Görev', 'Deneme', 'Bulan', 'Ödül', 'Durum', ''].map((h) => (
                      <th key={h} className="text-left px-5 py-3 font-medium text-xs" style={{ color: '#536471' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quests.map((q, idx) => {
                    const solveRate = q.total_attempts > 0 ? Math.round((q.total_solved / q.total_attempts) * 100) : 0;
                    const isExpired = q.expires_at && new Date(q.expires_at) < new Date();
                    return (
                      <tr key={q.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: idx < quests.length - 1 ? '1px solid #eff3f4' : 'none' }}>
                        <td className="px-5 py-3">
                          <div className="font-medium" style={{ color: '#0f1419' }}>{q.title}</div>
                          <div className="text-xs mt-0.5" style={{ color: '#8e9aab' }}>
                            {new Date(q.created_at).toLocaleDateString('tr-TR')}
                            {q.expires_at && <span className="ml-2">· Bitiş: {new Date(q.expires_at).toLocaleDateString('tr-TR')}</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3" style={{ color: '#536471' }}>{q.total_attempts}</td>
                        <td className="px-5 py-3">
                          <span style={{ color: '#536471' }}>{q.total_solved}</span>
                          {q.total_attempts > 0 && <span className="text-xs ml-1" style={{ color: '#8e9aab' }}>({solveRate}%)</span>}
                        </td>
                        <td className="px-5 py-3 font-bold" style={{ color: q.cash_reward > 0 ? '#22c55e' : '#c4c9d0' }}>
                          {q.cash_reward > 0 ? `${q.cash_reward}₺` : '-'}
                        </td>
                        <td className="px-5 py-3">
                          {isExpired ? (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626' }}>Sona Erdi</span>
                          ) : q.is_active ? (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a' }}>Aktif</span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#f0f2f4', color: '#8e9aab' }}>Pasif</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <Link href={`/quest/${q.id}`} className="text-xs hover:opacity-70 transition-colors" style={{ color: '#536471' }}>
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
    </AppShell>
  );
}
