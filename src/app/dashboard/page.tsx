import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Trophy, Target, Zap, MapPin, Sparkles, TrendingUp, Clock } from 'lucide-react';
import Header from '@/components/Header';

export const revalidate = 0;

type Pickable<T> = T | T[] | null;
const pick = <T,>(x: Pickable<T>): T | null => (Array.isArray(x) ? x[0] : x) || null;

function timeAgo(date: string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}d`;
  if (s < 86400) return `${Math.floor(s / 3600)}sa`;
  return `${Math.floor(s / 86400)}g`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/dashboard');

  const [profileRes, progressRes, postsRes, featuredRes, dailyRes] = await Promise.all([
    supabase.from('profiles').select('username, total_finds, total_wins, is_admin, is_business').eq('id', user.id).single(),
    supabase.from('user_quest_progress')
      .select('id, current_step, quests(id, title, photo_url)')
      .eq('user_id', user.id).eq('is_completed', false)
      .order('last_activity_at', { ascending: false }).limit(3),
    supabase.from('posts')
      .select('id, content, created_at, post_type, profiles(username), quests(id, title, photo_url, cash_reward)')
      .order('created_at', { ascending: false }).limit(15),
    supabase.from('quests').select('id, title, photo_url, cash_reward, difficulty').eq('is_active', true).eq('is_featured', true).limit(3),
    supabase.from('quests').select('id, title, photo_url, cash_reward, difficulty, category:categories(icon, name, color)').eq('is_active', true).order('created_at', { ascending: false }).limit(1),
  ]);

  const profile = profileRes.data;
  const activeQuests = progressRes.data || [];
  const posts = postsRes.data || [];
  const featured = featuredRes.data || [];
  const dailyQuest = (dailyRes.data || [])[0];

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-5">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Sol/Orta: Feed */}
          <div className="lg:col-span-2 space-y-4">

            {/* Hoş geldin başlık */}
            <div>
              <h1 className="text-xl font-black text-white">Merhaba, @{profile?.username} 👋</h1>
              <p className="text-white/30 text-sm">Bugün ne keşfedeceksin?</p>
            </div>

            {/* Hızlı istatistikler */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: <Target size={14} />, val: profile?.total_finds || 0, label: 'Bulduğun', c: '#ff6b2b' },
                { icon: <Trophy size={14} />, val: profile?.total_wins || 0, label: 'Kazandığın', c: '#22c55e' },
                { icon: <Zap size={14} />, val: activeQuests.length, label: 'Aktif', c: '#a855f7' },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl p-3 flex items-center gap-2.5" style={cardStyle}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: s.c + '20', color: s.c }}>
                    {s.icon}
                  </div>
                  <div>
                    <div className="text-lg font-black text-white leading-none">{s.val}</div>
                    <div className="text-white/40 text-[10px] mt-0.5">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Günün görevi */}
            {dailyQuest && (
              <Link href={`/quest/${dailyQuest.id}`}
                className="block rounded-2xl overflow-hidden relative group hover:scale-[1.01] transition-transform"
                style={{ background: 'linear-gradient(135deg, rgba(255,107,43,0.15), rgba(168,85,247,0.1))', border: '1px solid rgba(255,107,43,0.2)' }}>
                <div className="flex">
                  <img src={dailyQuest.photo_url} className="w-32 h-32 object-cover" alt="" />
                  <div className="flex-1 p-4">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles size={12} style={{ color: '#ff6b2b' }} />
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#ff6b2b' }}>Günün Görevi</span>
                    </div>
                    <h3 className="font-black text-white text-base mb-1 line-clamp-1">{dailyQuest.title}</h3>
                    {dailyQuest.cash_reward > 0 && (
                      <div className="text-green-400 text-sm font-bold">💰 {dailyQuest.cash_reward}₺ ödül</div>
                    )}
                  </div>
                </div>
              </Link>
            )}

            {/* Devam eden görevler */}
            {activeQuests.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={cardStyle}>
                <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                  <Zap size={14} style={{ color: '#ff6b2b' }} />
                  <h2 className="font-bold text-white text-sm">Devam Eden Görevler</h2>
                </div>
                <div className="divide-y divide-white/5">
                  {activeQuests.map((p) => {
                    const q = pick(p.quests);
                    return (
                      <Link key={p.id} href={`/quest/${q?.id}`} className="flex items-center gap-3 p-3 hover:bg-white/3 transition-colors">
                        {q?.photo_url && <img src={q.photo_url} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" alt="" />}
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm font-semibold truncate">{q?.title}</div>
                          <div className="text-white/30 text-xs">Adım {p.current_step}</div>
                        </div>
                        <span className="text-orange-400 text-xs font-bold">Devam →</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sosyal Akış (X tarzı) */}
            <div className="rounded-2xl overflow-hidden" style={cardStyle}>
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <h2 className="font-bold text-white text-sm flex items-center gap-2">
                  <TrendingUp size={14} style={{ color: '#a855f7' }} />
                  Sosyal Akış
                </h2>
                <span className="text-xs text-white/30">{posts.length} aktivite</span>
              </div>
              {posts.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="text-4xl mb-2">📭</div>
                  <p className="text-white/30 text-sm">Henüz aktivite yok</p>
                  <p className="text-white/20 text-xs mt-1">İlk görevi sen tamamla!</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {posts.map((post) => {
                    const p = pick(post.profiles);
                    const q = pick(post.quests);
                    return (
                      <article key={post.id} className="p-4 hover:bg-white/3 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0" style={{ background: 'linear-gradient(135deg, #ff6b2b, #a855f7)' }}>
                            {p?.username?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white font-bold text-sm">@{p?.username}</span>
                              <span className="text-white/30 text-xs">·</span>
                              <span className="text-white/30 text-xs">{timeAgo(post.created_at)}</span>
                            </div>
                            <p className="text-white/80 text-sm leading-relaxed">
                              {post.content}
                            </p>
                            {q && (
                              <Link href={`/quest/${q.id}`} className="mt-3 flex items-center gap-3 p-2 rounded-xl border border-white/10 hover:bg-white/5 transition-colors">
                                {q.photo_url && <img src={q.photo_url} className="w-12 h-12 rounded-lg object-cover" alt="" />}
                                <div className="flex-1 min-w-0">
                                  <div className="text-white text-xs font-semibold truncate">{q.title}</div>
                                  {q.cash_reward > 0 && (
                                    <div className="text-green-400 text-xs font-bold">{q.cash_reward}₺ ödül</div>
                                  )}
                                </div>
                              </Link>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sağ: Sidebar */}
          <aside className="space-y-4">

            {/* Öne çıkan görevler */}
            <div className="rounded-2xl overflow-hidden" style={cardStyle}>
              <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                <MapPin size={14} style={{ color: '#ff6b2b' }} />
                <h2 className="font-bold text-white text-sm">Öne Çıkanlar</h2>
              </div>
              {featured.length === 0 ? (
                <div className="p-6 text-center text-white/20 text-sm">Görev yok</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {featured.map((q) => (
                    <Link key={q.id} href={`/quest/${q.id}`} className="flex items-center gap-3 p-3 hover:bg-white/3 transition-colors">
                      <img src={q.photo_url} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" alt="" />
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-xs font-semibold truncate">{q.title}</div>
                        {q.cash_reward > 0 && <div className="text-green-400 text-xs font-bold">{q.cash_reward}₺</div>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Hızlı linkler */}
            <div className="rounded-2xl overflow-hidden" style={cardStyle}>
              <div className="px-4 py-3 border-b border-white/5">
                <h2 className="font-bold text-white text-sm">Hızlı Erişim</h2>
              </div>
              <div className="divide-y divide-white/5">
                <Link href="/" className="flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors">
                  <MapPin size={14} style={{ color: '#ff6b2b' }} />
                  <span className="text-white/70 text-sm">Tüm Görevler</span>
                </Link>
                <Link href="/map" className="flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors">
                  <MapPin size={14} style={{ color: '#a855f7' }} />
                  <span className="text-white/70 text-sm">Harita</span>
                </Link>
                <Link href="/friends" className="flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors">
                  <Trophy size={14} style={{ color: '#22c55e' }} />
                  <span className="text-white/70 text-sm">Arkadaşlar</span>
                </Link>
                <Link href="/messages" className="flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors">
                  <Clock size={14} style={{ color: '#eab308' }} />
                  <span className="text-white/70 text-sm">Mesajlar</span>
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
