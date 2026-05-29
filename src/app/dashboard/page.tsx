import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Trophy, Target, Zap, MapPin, Heart, MessageCircle, Send } from 'lucide-react';
import Header from '@/components/Header';

export const revalidate = 0;

type Pickable<T> = T | T[] | null;
const pick = <T,>(x: Pickable<T>): T | null => (Array.isArray(x) ? x[0] : x) || null;

function timeAgo(date: string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}s önce`;
  if (s < 3600) return `${Math.floor(s / 60)}dk önce`;
  if (s < 86400) return `${Math.floor(s / 3600)}sa önce`;
  return `${Math.floor(s / 86400)}g önce`;
}

const STORY_GRADIENTS = [
  'linear-gradient(45deg,#ff6b2b,#a855f7)',
  'linear-gradient(45deg,#ff3d00,#ff6b2b)',
  'linear-gradient(45deg,#a855f7,#ec4899)',
  'linear-gradient(45deg,#22c55e,#10b981)',
  'linear-gradient(45deg,#eab308,#ff6b2b)',
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/dashboard');

  const [profileRes, progressRes, postsRes, featuredRes] = await Promise.all([
    supabase.from('profiles').select('username, total_finds, total_wins, is_admin, is_business').eq('id', user.id).single(),
    supabase.from('user_quest_progress')
      .select('id, current_step, quests(id, title, photo_url)')
      .eq('user_id', user.id).eq('is_completed', false)
      .order('last_activity_at', { ascending: false }).limit(3),
    supabase.from('posts')
      .select('id, content, created_at, post_type, profiles(username), quests(id, title, photo_url, cash_reward)')
      .order('created_at', { ascending: false }).limit(20),
    supabase.from('quests')
      .select('id, title, photo_url, cash_reward, difficulty')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const profile = profileRes.data;
  const activeQuests = progressRes.data || [];
  const posts = postsRes.data || [];
  const featured = featuredRes.data || [];

  return (
    <div style={{ background: '#fafafa', minHeight: '100vh' }}>
      <Header />

      {/* Stories / Featured Quests row */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #efefef' }}>
        <div className="max-w-[935px] mx-auto px-4 py-4">
          <div className="flex gap-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {/* "Günlük Görev" başlat butonu */}
            <Link href="/" className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                style={{ background: 'linear-gradient(45deg,#ff6b2b,#a855f7)', border: '3px solid #fafafa', boxShadow: '0 0 0 3px #ff6b2b' }}>
                🗺️
              </div>
              <span className="text-xs font-medium text-center w-16 truncate" style={{ color: '#262626' }}>Keşfet</span>
            </Link>

            {featured.map((q, i) => (
              <Link key={q.id} href={`/quest/${q.id}`} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className="w-16 h-16 rounded-full overflow-hidden"
                  style={{ padding: '2px', background: STORY_GRADIENTS[i % STORY_GRADIENTS.length] }}>
                  <div className="w-full h-full rounded-full overflow-hidden" style={{ border: '2px solid #fff' }}>
                    {q.photo_url
                      ? <img src={q.photo_url} className="w-full h-full object-cover" alt="" />
                      : <div className="w-full h-full flex items-center justify-center text-lg" style={{ background: '#f0f0f0' }}>📍</div>
                    }
                  </div>
                </div>
                <span className="text-xs font-medium text-center w-16 truncate" style={{ color: '#262626' }}>{q.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="max-w-[935px] mx-auto px-4 py-6 flex gap-8">

        {/* Sol: Feed */}
        <div className="flex-1 min-w-0 space-y-0">

          {/* Kullanıcı stats bar — Instagram profil gibi */}
          <div className="rounded-2xl mb-4 p-4 flex items-center gap-4"
            style={{ background: '#fff', border: '1px solid #efefef' }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#ff6b2b,#a855f7)' }}>
              {profile?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-bold text-base" style={{ color: '#262626' }}>@{profile?.username}</p>
              <p className="text-sm" style={{ color: '#8e8e8e' }}>Türkiye&apos;yi keşfediyorsun</p>
            </div>
            <div className="flex gap-5 text-center">
              {[
                { val: profile?.total_finds || 0, label: 'Buldu', icon: <Target size={14} />, c: '#ff6b2b' },
                { val: profile?.total_wins || 0, label: 'Kazandı', icon: <Trophy size={14} />, c: '#22c55e' },
                { val: activeQuests.length, label: 'Aktif', icon: <Zap size={14} />, c: '#a855f7' },
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-xl font-black" style={{ color: '#262626' }}>{s.val}</span>
                  <span className="text-xs" style={{ color: '#8e8e8e' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Devam eden görevler */}
          {activeQuests.length > 0 && (
            <div className="rounded-2xl mb-4 overflow-hidden" style={{ background: '#fff', border: '1px solid #efefef' }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: '#efefef' }}>
                <p className="font-bold text-sm flex items-center gap-1.5" style={{ color: '#262626' }}>
                  <Zap size={14} color="#a855f7" /> Devam Eden Görevler
                </p>
              </div>
              {activeQuests.map((p) => {
                const q = pick(p.quests);
                return (
                  <Link key={p.id} href={`/quest/${q?.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b last:border-0"
                    style={{ borderColor: '#efefef' }}>
                    {q?.photo_url && <img src={q.photo_url} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" alt="" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#262626' }}>{q?.title}</p>
                      <p className="text-xs" style={{ color: '#8e8e8e' }}>Adım {p.current_step} · devam ediyor</p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full"
                      style={{ background: 'rgba(255,107,43,0.1)', color: '#ff6b2b' }}>Devam →</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Feed - Instagram/X post tarzı */}
          {posts.length === 0 ? (
            <div className="rounded-2xl p-12 text-center" style={{ background: '#fff', border: '1px solid #efefef' }}>
              <div className="text-5xl mb-3">📭</div>
              <p className="font-bold text-lg" style={{ color: '#262626' }}>Henüz aktivite yok</p>
              <p className="text-sm mt-1" style={{ color: '#8e8e8e' }}>İlk görevi tamamlayan sen ol!</p>
              <Link href="/" className="inline-block mt-4 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
                Görevlere Git
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #efefef' }}>
              {posts.map((post, idx) => {
                const p = pick(post.profiles);
                const q = pick(post.quests);
                return (
                  <article key={post.id}
                    className="border-b last:border-0"
                    style={{ borderColor: '#efefef' }}>

                    {/* Post header */}
                    <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
                        style={{ background: STORY_GRADIENTS[idx % STORY_GRADIENTS.length] }}>
                        {p?.username?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold leading-none" style={{ color: '#262626' }}>@{p?.username}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#8e8e8e' }}>{timeAgo(post.created_at)}</p>
                      </div>
                    </div>

                    {/* Quest image (tam genişlik — Instagram gibi) */}
                    {q?.photo_url && (
                      <Link href={`/quest/${q.id}`}>
                        <img src={q.photo_url} className="w-full object-cover" style={{ maxHeight: 320 }} alt="" />
                      </Link>
                    )}

                    {/* Post içerik */}
                    <div className="px-4 pb-3 pt-2">
                      {/* Aksiyon butonları — Instagram gibi */}
                      <div className="flex items-center gap-4 mb-2">
                        <button className="flex items-center gap-1.5 text-sm" style={{ color: '#262626' }}>
                          <Heart size={20} />
                        </button>
                        <button className="flex items-center gap-1.5 text-sm" style={{ color: '#262626' }}>
                          <MessageCircle size={20} />
                        </button>
                        <button className="flex items-center gap-1.5 text-sm" style={{ color: '#262626' }}>
                          <Send size={20} />
                        </button>
                      </div>

                      {/* İçerik */}
                      <p className="text-sm" style={{ color: '#262626' }}>
                        <span className="font-bold">@{p?.username}</span>{' '}
                        {post.content}
                      </p>

                      {/* Quest link */}
                      {q && (
                        <Link href={`/quest/${q.id}`}
                          className="mt-2 flex items-center gap-2 p-2 rounded-xl"
                          style={{ background: 'rgba(255,107,43,0.06)', border: '1px solid rgba(255,107,43,0.15)' }}>
                          <MapPin size={13} color="#ff6b2b" />
                          <span className="text-xs font-semibold truncate" style={{ color: '#ff6b2b' }}>{q.title}</span>
                          {q.cash_reward > 0 && (
                            <span className="ml-auto text-xs font-bold flex-shrink-0" style={{ color: '#22c55e' }}>{q.cash_reward}₺</span>
                          )}
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Sağ: Sidebar — Instagram sağ panel gibi */}
        <aside className="w-[300px] flex-shrink-0 hidden lg:block space-y-5">

          {/* Profil özeti */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black"
              style={{ background: 'linear-gradient(135deg,#ff6b2b,#a855f7)' }}>
              {profile?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: '#262626' }}>@{profile?.username}</p>
              <Link href="/profile" className="text-xs font-semibold" style={{ color: '#ff6b2b' }}>Profili Gör</Link>
            </div>
          </div>

          {/* Önerilen görevler */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold" style={{ color: '#8e8e8e' }}>ÖNE ÇIKANLAR</p>
              <Link href="/" className="text-xs font-bold" style={{ color: '#262626' }}>Hepsini Gör</Link>
            </div>
            <div className="space-y-3">
              {featured.slice(0, 5).map((q, i) => (
                <Link key={q.id} href={`/quest/${q.id}`} className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0"
                    style={{ border: '1px solid #efefef' }}>
                    {q.photo_url
                      ? <img src={q.photo_url} className="w-full h-full object-cover" alt="" />
                      : <div className="w-full h-full flex items-center justify-center text-base" style={{ background: '#f0f0f0' }}>📍</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate group-hover:underline" style={{ color: '#262626' }}>{q.title}</p>
                    {q.cash_reward > 0
                      ? <p className="text-xs font-bold" style={{ color: '#22c55e' }}>{q.cash_reward}₺ ödül</p>
                      : <p className="text-xs" style={{ color: '#8e8e8e' }}>Ücretsiz görev</p>
                    }
                  </div>
                  <span className="text-xs font-bold flex-shrink-0" style={{ color: '#ff6b2b' }}>Bak</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Hızlı linkler */}
          <div>
            <div className="mb-2">
              <p className="text-sm font-bold" style={{ color: '#8e8e8e' }}>HIZLI ERİŞİM</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { href: '/map', label: '🗺️ Harita' },
                { href: '/friends', label: '👥 Arkadaşlar' },
                { href: '/messages', label: '💬 Mesajlar' },
                { href: '/leaderboard', label: '🏆 Sıralama' },
              ].map((item) => (
                <Link key={item.href} href={item.href}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors hover:opacity-80"
                  style={{ background: 'rgba(255,107,43,0.08)', color: '#ff6b2b', border: '1px solid rgba(255,107,43,0.2)' }}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <p className="text-xs" style={{ color: '#c7c7c7' }}>© 2025 İzi Bul · Türkiye&apos;yi Keşfet</p>
        </aside>

      </div>
    </div>
  );
}
