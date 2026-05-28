import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { MapPin, Trophy, Target, Users, MessageCircle, Bell, Zap } from 'lucide-react';
import Header from '@/components/Header';

export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/dashboard');

  const [profileRes, progressRes, postsRes, requestsRes, featuredRes] = await Promise.all([
    supabase.from('profiles').select('username, total_finds, total_wins, is_admin, is_business').eq('id', user.id).single(),
    supabase.from('user_quest_progress').select('*, quests(id, title, photo_url)').eq('user_id', user.id).eq('is_completed', false).order('last_activity_at', { ascending: false }).limit(3),
    supabase.from('posts').select('*, profiles(username), quests(title, photo_url)').order('created_at', { ascending: false }).limit(10),
    supabase.from('friend_requests').select('*, from_user:profiles!friend_requests_from_user_id_fkey(username)').eq('to_user_id', user.id).eq('status', 'pending'),
    supabase.from('quests').select('id, title, photo_url, cash_reward, difficulty').eq('is_active', true).eq('is_featured', true).order('created_at', { ascending: false }).limit(3),
  ]);

  const profile = profileRes.data;
  const activeQuests = progressRes.data || [];
  const posts = postsRes.data || [];
  const pendingRequests = requestsRes.data || [];
  const featured = featuredRes.data || [];

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6">

        {/* Hoş geldin */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Merhaba, @{profile?.username} 👋</h1>
            <p className="text-white/30 text-sm mt-0.5">Bugün hangi görevi çözeceksin?</p>
          </div>
          {pendingRequests.length > 0 && (
            <Link href="/friends" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: 'rgba(168,85,247,0.2)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)' }}>
              <Bell size={15} />
              {pendingRequests.length} arkadaşlık isteği
            </Link>
          )}
        </div>

        {/* Hızlı istatistikler */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: <Target size={16} />, val: profile?.total_finds || 0, label: 'Bulunan', color: '#ff6b2b' },
            { icon: <Trophy size={16} />, val: profile?.total_wins || 0, label: 'Kazanılan', color: '#22c55e' },
            { icon: <Users size={16} />, val: activeQuests.length, label: 'Devam Eden', color: '#a855f7' },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-4 text-center" style={cardStyle}>
              <div className="flex justify-center mb-1.5" style={{ color: s.color }}>{s.icon}</div>
              <div className="text-2xl font-black text-white">{s.val}</div>
              <div className="text-white/30 text-xs">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Sol sütun */}
          <div className="lg:col-span-2 space-y-5">

            {/* Devam eden görevler */}
            {activeQuests.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={cardStyle}>
                <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
                  <Zap size={15} style={{ color: '#ff6b2b' }} />
                  <h2 className="font-bold text-white">Devam Eden Görevler</h2>
                </div>
                <div className="divide-y divide-white/5">
                  {activeQuests.map((p) => {
                    const q = p.quests as { id?: string; title?: string; photo_url?: string } | null;
                    return (
                      <Link key={p.id} href={`/quest/${q?.id}`} className="flex items-center gap-3 p-4 hover:bg-white/3 transition-colors">
                        {q?.photo_url && <img src={q.photo_url} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" alt="" />}
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm font-semibold truncate">{q?.title}</div>
                          <div className="text-white/30 text-xs">Adım {p.current_step} · Devam et →</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sosyal akış */}
            <div className="rounded-2xl overflow-hidden" style={cardStyle}>
              <div className="px-5 py-4 border-b border-white/5">
                <h2 className="font-bold text-white">Son Aktiviteler</h2>
              </div>
              <div className="divide-y divide-white/5">
                {posts.length === 0 ? (
                  <div className="p-8 text-center text-white/20">Henüz aktivite yok</div>
                ) : posts.map((post) => {
                  const p = post.profiles as { username?: string } | null;
                  const q = post.quests as { title?: string; photo_url?: string } | null;
                  return (
                    <div key={post.id} className="p-4 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, #ff6b2b, #a855f7)' }}>
                        {p?.username?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-sm">{post.content}</p>
                        <p className="text-white/30 text-xs mt-1">
                          {new Date(post.created_at).toLocaleString('tr-TR')}
                        </p>
                      </div>
                      {q?.photo_url && <img src={q.photo_url} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" alt="" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sağ sütun */}
          <div className="space-y-4">

            {/* Günlük öne çıkan görevler */}
            <div className="rounded-2xl overflow-hidden" style={cardStyle}>
              <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                <MapPin size={14} style={{ color: '#ff6b2b' }} />
                <h2 className="font-bold text-white text-sm">Öne Çıkan</h2>
              </div>
              <div className="divide-y divide-white/5">
                {featured.length === 0 ? (
                  <div className="p-6 text-center text-white/20 text-sm">Görev yok</div>
                ) : featured.map((q) => (
                  <Link key={q.id} href={`/quest/${q.id}`} className="flex items-center gap-3 p-3 hover:bg-white/3 transition-colors">
                    <img src={q.photo_url} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" alt="" />
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs font-semibold truncate">{q.title}</div>
                      {q.cash_reward > 0 && <div className="text-green-400 text-xs">{q.cash_reward}₺ ödül</div>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Hızlı linkler */}
            <div className="space-y-2">
              <Link href="/map" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:text-white transition-colors" style={cardStyle}>
                <MapPin size={16} style={{ color: '#ff6b2b' }} /> Haritayı Aç
              </Link>
              <Link href="/friends" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:text-white transition-colors" style={cardStyle}>
                <Users size={16} style={{ color: '#a855f7' }} /> Arkadaşlar
                {pendingRequests.length > 0 && <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(168,85,247,0.3)', color: '#a855f7' }}>{pendingRequests.length}</span>}
              </Link>
              <Link href="/messages" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:text-white transition-colors" style={cardStyle}>
                <MessageCircle size={16} style={{ color: '#22c55e' }} /> Mesajlar
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
