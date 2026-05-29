import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Shield, Users, MapPin, Clock, TrendingUp, Store, Tag, FileText } from 'lucide-react';
import Header from '@/components/Header';
import { ApproveButton, BusinessToggle, FeatureToggle, DeletePostButton } from './AdminActions';

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

  const { data: recentPosts } = await supabase
    .from('posts')
    .select('id, content, created_at, profiles(username)')
    .order('created_at', { ascending: false })
    .limit(20);

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
    <div className="min-h-screen" style={{ background: '#f7f8f8' }}>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)' }}>
            <Shield size={24} style={{ color: '#a855f7' }} />
          </div>
          <div>
            <h1 className="text-2xl font-black" style={{ color: '#0f1419' }}>Admin Paneli</h1>
            <p className="text-sm" style={{ color: '#536471' }}>İzi Bul yönetim merkezi</p>
          </div>
          <Link href="/admin/categories" className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: 'rgba(255,107,43,0.08)', color: '#ff6b2b', border: '1px solid rgba(255,107,43,0.2)' }}>
            <Tag size={14} /> Kategoriler
          </Link>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <div key={i} className="rounded-2xl p-5" style={{ background: '#ffffff', border: '1px solid #eff3f4' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.color + '18', color: s.color }}>
                  {s.icon}
                </div>
                <TrendingUp size={14} style={{ color: '#536471' }} />
              </div>
              <div className="text-3xl font-black" style={{ color: '#0f1419' }}>{s.val.toLocaleString('tr-TR')}</div>
              <div className="text-sm mt-1" style={{ color: '#536471' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Onay Bekleyenler */}
          <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #eff3f4' }}>
            <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #eff3f4' }}>
              <Clock size={16} className="text-yellow-400" />
              <h2 className="font-bold" style={{ color: '#0f1419' }}>Onay Bekleyenler</h2>
              {(pendingRes.count || 0) > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold ml-1" style={{ background: 'rgba(234,179,8,0.12)', color: '#ca8a04' }}>
                  {pendingRes.count}
                </span>
              )}
            </div>
            <div style={{ borderTop: 'none' }}>
              {!pendingSubmissions?.length ? (
                <div className="p-8 text-center" style={{ color: '#536471' }}>Bekleyen yok</div>
              ) : (
                pendingSubmissions.map((s, idx) => (
                  <div key={s.id} className="p-4 flex items-center gap-3" style={{ borderBottom: idx < pendingSubmissions.length - 1 ? '1px solid #eff3f4' : 'none' }}>
                    {s.photo_url && <img src={s.photo_url} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" alt="" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: '#0f1419' }}>
                        {(s as { profiles?: { username?: string } }).profiles?.username} → {(s as { quests?: { title?: string } }).quests?.title}
                      </div>
                      <div className="text-xs" style={{ color: '#536471' }}>{s.distance_meters}m uzakta</div>
                    </div>
                    <ApproveButton submissionId={s.id} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Son Görevler */}
          <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #eff3f4' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #eff3f4' }}>
              <h2 className="font-bold flex items-center gap-2" style={{ color: '#0f1419' }}>
                <MapPin size={16} style={{ color: '#ff6b2b' }} />
                Son Görevler
              </h2>
            </div>
            <div>
              {recentQuests?.map((q, idx) => (
                <div key={q.id} className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: idx < (recentQuests?.length ?? 0) - 1 ? '1px solid #eff3f4' : 'none' }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: '#0f1419' }}>{q.title}</div>
                    <div className="text-xs" style={{ color: '#536471' }}>
                      {(q as { profiles?: { username?: string } }).profiles?.username} · {q.total_attempts} deneme
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FeatureToggle questId={q.id} isFeatured={q.is_featured} />
                    <Link href={`/quest/${q.id}`} className="text-xs transition-colors hover:opacity-70" style={{ color: '#536471' }}>
                      Gör →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Kullanıcı Yönetimi */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #eff3f4' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #eff3f4' }}>
            <h2 className="font-bold flex items-center gap-2" style={{ color: '#0f1419' }}>
              <Users size={16} style={{ color: '#a855f7' }} />
              Kullanıcı Yönetimi
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #eff3f4' }}>
                  {['Kullanıcı', 'Görev', 'Rol', 'Kayıt', 'İşlem'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 font-medium text-xs" style={{ color: '#536471' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allUsers?.map((u, idx) => (
                  <tr key={u.id} className="transition-colors hover:bg-gray-50" style={{ borderBottom: idx < (allUsers?.length ?? 0) - 1 ? '1px solid #eff3f4' : 'none' }}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #ff6b2b, #a855f7)' }}>
                          {u.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium" style={{ color: '#0f1419' }}>@{u.username}</div>
                          {u.business_name && <div className="text-xs" style={{ color: '#536471' }}>🏪 {u.business_name}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3" style={{ color: '#536471' }}>{u.total_finds}</td>
                    <td className="px-5 py-3">
                      {u.is_admin ? (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(168,85,247,0.12)', color: '#9333ea' }}>Admin</span>
                      ) : u.is_business ? (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.12)', color: '#16a34a' }}>İşletme</span>
                      ) : (
                        <span className="text-xs" style={{ color: '#536471' }}>Kullanıcı</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: '#536471' }}>
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

        {/* Gönderiler — silme */}
        <div className="rounded-2xl overflow-hidden mt-6" style={{ background: '#ffffff', border: '1px solid #eff3f4' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #eff3f4' }}>
            <h2 className="font-bold flex items-center gap-2" style={{ color: '#0f1419' }}>
              <FileText size={16} style={{ color: '#ff6b2b' }} />
              Son Gönderiler ({recentPosts?.length || 0})
            </h2>
          </div>
          <div>
            {!recentPosts?.length ? (
              <div className="p-8 text-center text-sm" style={{ color: '#536471' }}>Gönderi yok</div>
            ) : recentPosts.map((post) => {
              const u = post.profiles as unknown as { username?: string } | null;
              return (
                <div key={post.id} className="flex items-start gap-3 px-5 py-3" style={{ borderBottom: '1px solid #eff3f4' }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold" style={{ color: '#0f1419' }}>@{u?.username}</div>
                    <div className="text-sm truncate mt-0.5" style={{ color: '#536471' }}>{post.content}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#8e8e8e' }}>{new Date(post.created_at).toLocaleString('tr-TR')}</div>
                  </div>
                  <DeletePostButton postId={post.id} />
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
