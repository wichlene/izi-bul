import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Trophy, Target, Zap, MapPin, Sparkles, TrendingUp } from 'lucide-react';
import Header from '@/components/Header';

export const revalidate = 0;

type Pickable<T> = T | T[] | null;
const pick = <T,>(x: Pickable<T>): T | null => (Array.isArray(x) ? x[0] : x) || null;

function timeAgo(date: string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}dk`;
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
      .order('created_at', { ascending: false }).limit(20),
    supabase.from('quests').select('id, title, photo_url, cash_reward, difficulty').eq('is_active', true).eq('is_featured', true).limit(4),
    supabase.from('quests').select('id, title, photo_url, cash_reward, difficulty, category:categories(icon, name, color)').eq('is_active', true).order('created_at', { ascending: false }).limit(1),
  ]);

  const profile = profileRes.data;
  const activeQuests = progressRes.data || [];
  const posts = postsRes.data || [];
  const featured = featuredRes.data || [];
  const dailyQuest = (dailyRes.data || [])[0];

  return (
    <div className="min-h-screen" style={{ background: '#000000' }}>
      <Header />
      <main className="max-w-[1200px] mx-auto flex gap-0">

        {/* Sol Feed */}
        <div className="flex-1 min-w-0 border-x" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>

          {/* Feed başlığı - X tarzı sticky */}
          <div className="sticky top-0 z-10 backdrop-blur-md border-b" style={{ background: 'rgba(0,0,0,0.85)', borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="px-4 py-3">
              <h2 className="font-black text-white text-xl">Ana Sayfa</h2>
            </div>
            <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <button className="flex-1 py-3 text-sm font-bold text-white border-b-2" style={{ borderColor: '#ff6b2b' }}>
                Keşfet
              </button>
              <button className="flex-1 py-3 text-sm font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Görevler
              </button>
            </div>
          </div>

          {/* Hoş geldin kartı */}
          <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #ff6b2b, #a855f7)' }}>
                {profile?.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-white font-bold">Merhaba, @{profile?.username} 👋</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Bugün ne keşfedeceksin?</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: <Target size={13} />, val: profile?.total_finds || 0, label: 'Bulduğun', c: '#ff6b2b' },
                { icon: <Trophy size={13} />, val: profile?.total_wins || 0, label: 'Kazandığın', c: '#22c55e' },
                { icon: <Zap size={13} />, val: activeQuests.length, label: 'Aktif Görev', c: '#a855f7' },
              ].map((s, i) => (
                <div key={i} className="rounded-xl p-2.5 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: s.c + '22', color: s.c }}>
                    {s.icon}
                  </div>
                  <div>
                    <div className="text-base font-black text-white leading-none">{s.val}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Günün görevi */}
          {dailyQuest && (
            <Link href={`/quest/${dailyQuest.id}`}
              className="block border-b hover:bg-white/[0.02] transition-colors"
              style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="px-4 py-3 flex gap-3">
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,107,43,0.15)', border: '1px solid rgba(255,107,43,0.3)' }}>
                  <Sparkles size={20} style={{ color: '#ff6b2b' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-bold" style={{ color: '#ff6b2b' }}>Günün Görevi</span>
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>bugün</span>
                  </div>
                  <p className="text-white font-bold text-sm">{dailyQuest.title}</p>
                  {dailyQuest.cash_reward > 0 && (
                    <p className="text-sm font-bold mt-0.5" style={{ color: '#22c55e' }}>💰 {dailyQuest.cash_reward}₺ ödül</p>
                  )}
                  {dailyQuest.photo_url && (
                    <img src={dailyQuest.photo_url} className="mt-2 w-full max-h-40 object-cover rounded-2xl" alt="" />
                  )}
                </div>
              </div>
            </Link>
          )}

          {/* Devam eden görevler */}
          {activeQuests.length > 0 && (
            <div className="border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="px-4 py-2 flex items-center gap-2">
                <Zap size={13} style={{ color: '#a855f7' }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>Devam Eden</span>
              </div>
              {activeQuests.map((p) => {
                const q = pick(p.quests);
                return (
                  <Link key={p.id} href={`/quest/${q?.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors border-t"
                    style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    {q?.photo_url && <img src={q.photo_url} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" alt="" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-semibold truncate">{q?.title}</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Adım {p.current_step}</div>
                    </div>
                    <span className="text-xs font-bold" style={{ color: '#ff6b2b' }}>Devam →</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Feed - X tweet tarzı */}
          {posts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-3">📭</div>
              <p className="text-white font-bold text-lg mb-1">Henüz aktivite yok</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>İlk görevi sen tamamla!</p>
            </div>
          ) : (
            posts.map((post) => {
              const p = pick(post.profiles);
              const q = pick(post.quests);
              return (
                <article key={post.id}
                  className="px-4 py-3 border-b hover:bg-white/[0.02] transition-colors cursor-pointer"
                  style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #ff6b2b, #a855f7)' }}>
                      {p?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-white font-bold text-sm">@{p?.username}</span>
                        <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{timeAgo(post.created_at)}</span>
                      </div>
                      <p className="text-sm mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
                        {post.content}
                      </p>
                      {q && (
                        <Link href={`/quest/${q.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-2 flex items-center gap-3 p-3 rounded-2xl transition-colors hover:bg-white/[0.04]"
                          style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                          {q.photo_url && <img src={q.photo_url} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" alt="" />}
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-xs font-bold truncate">{q.title}</div>
                            {q.cash_reward > 0 && (
                              <div className="text-xs font-bold mt-0.5" style={{ color: '#22c55e' }}>{q.cash_reward}₺ ödül</div>
                            )}
                          </div>
                        </Link>
                      )}
                      <div className="flex gap-5 mt-2">
                        <span className="text-xs flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
                          <MapPin size={12} /> Haritada Gör
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* Sağ Sidebar - X tarzı */}
        <div className="w-[350px] flex-shrink-0 hidden lg:block px-4 py-4 space-y-4">

          {/* Öne çıkan görevler */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <h2 className="font-black text-white text-lg">Öne Çıkan Görevler</h2>
            </div>
            {featured.length === 0 ? (
              <div className="p-6 text-center text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>Görev yok</div>
            ) : (
              <div>
                {featured.map((q, i) => (
                  <Link key={q.id} href={`/quest/${q.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors border-b last:border-0"
                    style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <span className="text-sm font-black w-5 text-center flex-shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>{i + 1}</span>
                    {q.photo_url && <img src={q.photo_url} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" alt="" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-semibold truncate">{q.title}</div>
                      {q.cash_reward > 0 && (
                        <div className="text-xs font-bold" style={{ color: '#22c55e' }}>{q.cash_reward}₺</div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <div className="px-4 py-3">
              <Link href="/" className="text-sm font-semibold" style={{ color: '#ff6b2b' }}>
                Tüm görevleri gör →
              </Link>
            </div>
          </div>

          {/* Hızlı erişim */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <h2 className="font-black text-white text-lg">Keşfet</h2>
            </div>
            <div>
              {[
                { href: '/', icon: <MapPin size={16} />, label: 'Tüm Görevler', color: '#ff6b2b' },
                { href: '/map', icon: <TrendingUp size={16} />, label: 'Canlı Harita', color: '#a855f7' },
                { href: '/friends', icon: <Trophy size={16} />, label: 'Arkadaşlar', color: '#22c55e' },
                { href: '/messages', icon: <Zap size={16} />, label: 'Mesajlar', color: '#eab308' },
              ].map((item) => (
                <Link key={item.href} href={item.href}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors border-b last:border-0"
                  style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: item.color + '20', color: item.color }}>
                    {item.icon}
                  </div>
                  <span className="text-white text-sm font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
