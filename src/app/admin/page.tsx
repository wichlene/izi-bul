import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Shield, Users, MapPin, Clock, TrendingUp, Store, Tag } from 'lucide-react';
import Header from '@/components/Header';
import { ApproveButton, BusinessToggle, FeatureToggle } from './AdminActions';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) redirect('/');

  const [usersRes, questsRes, subsRes, pendingRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('quests').select('id', { count: 'exact', head: true }),
    supabase.from('submissions').select('id', { count: 'exact', head: true }),
    supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  const { data: allUsers } = await supabase
    .from('profiles')
    .select('id, username, full_name, total_finds, created_at, is_premium, is_business, is_admin, business_name')
    .order('created_at', { ascending: false })
    .limit(20);

  const { data: pendingSubmissions } = await supabase
    .from('submissions')
    .select('id, created_at, photo_url, distance_meters, profiles(username), quests(title)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: recentQuests } = await supabase
    .from('quests')
    .select('id, title, total_attempts, total_solved, is_featured, created_at, profiles(username)')
    .order('created_at', { ascending: false })
    .limit(10);

  const stats = [
    { icon: <Users size={20} />, val: usersRes.count || 0, label: 'Kullanıcı', color: '#a855f7' },
    { icon: <MapPin size={20} />, val: questsRes.count || 0, label: 'Görev', color: '#ff6b2b' },
    { icon: <Store size={20} />, val: allUsers?.filter(u => u.is_business).length || 0, label: 'İşletme', color: '#22c55e' },
    { icon: <Clock size={20} />, val: pendingRes.count || 0, label: 'Onay Bekleyen', color: '#eab308' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.2)' }}>
            <Shield size={24} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Admin Paneli</h1>
            <p className="text-white/30 text-sm">İzi Bul yönetim merkezi</p>
          </div>
          <Link href="/admin/categories" className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: 'rgba(255,107,43,0.15)', color: '#ff6b2b', border: '1px solid rgba(255,107,43,0.25)' }}>
            <Tag size={14} /> Kategoriler
          </Link>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <div key={i} className="rounded-2xl p-5 border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.color + '20', color: s.color }}>
                  {s.icon}
                </div>
                <TrendingUp size={14} className="text-white/20" />
              </div>
              <div className="text-3xl font-black text-white">{s.val.toLocaleString('tr-TR')}</div>
              <div className="text-white/40 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Onay Bekleyenler */}
          <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
              <Clock size={16} className="text-yellow-400" />
              <h2 className="font-bold text-white">Onay Bekleyenler</h2>
              {(pendingRes.count || 0) > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold ml-1" style={{ background: 'rgba(234,179,8,0.2)', color: '#eab308' }}>
                  {pendingRes.count}
                </span>
              )}
            </div>
            <div className="divide-y divide-white/5">
              {!pendingSubmissions?.length ? (
                <div className="p-8 text-center text-white/20">Bekleyen yok</div>
              ) : (
                pendingSubmissions.map((s) => (
                  <div key={s.id} className="p-4 flex items-center gap-3">
                    {s.photo_url && <img src={s.photo_url} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" alt="" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-semibold truncate">
                        {(s as { profiles?: { username?: string } }).profiles?.username} → {(s as { quests?: { title?: string } }).quests?.title}
                      </div>
                      <div className="text-white/30 text-xs">{s.distance_meters}m uzakta</div>
                    </div>
                    <ApproveButton submissionId={s.id} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Son Görevler */}
          <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="px-5 py-4 border-b border-white/5">
              <h2 className="font-bold text-white flex items-center gap-2">
                <MapPin size={16} style={{ color: '#ff6b2b' }} />
                Son Görevler
              </h2>
            </div>
            <div className="divide-y divide-white/5">
              {recentQuests?.map((q) => (
                <div key={q.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">{q.title}</div>
                    <div className="text-white/30 text-xs">
                      {(q as { profiles?: { username?: string } }).profiles?.username} · {q.total_attempts} deneme
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FeatureToggle questId={q.id} isFeatured={q.is_featured} />
                    <Link href={`/quest/${q.id}`} className="text-white/30 hover:text-white text-xs transition-colors">
                      Gör →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Kullanıcı Yönetimi */}
        <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Users size={16} className="text-purple-400" />
              Kullanıcı Yönetimi
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Kullanıcı', 'Görev', 'Rol', 'Kayıt', 'İşlem'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-white/30 font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {allUsers?.map((u) => (
                  <tr key={u.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg, #ff6b2b, #a855f7)' }}>
                          {u.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-medium">@{u.username}</div>
                          {u.business_name && <div className="text-white/30 text-xs">🏪 {u.business_name}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-white/60">{u.total_finds}</td>
                    <td className="px-5 py-3">
                      {u.is_admin ? (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(168,85,247,0.2)', color: '#a855f7' }}>Admin</span>
                      ) : u.is_business ? (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.2)', color: '#22c55e' }}>İşletme</span>
                      ) : (
                        <span className="text-xs text-white/20">Kullanıcı</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-white/30 text-xs">
                      {new Date(u.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-5 py-3">
                      {!u.is_admin && (
                        <BusinessToggle userId={u.id} isBusiness={u.is_business || false} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

