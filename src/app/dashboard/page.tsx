import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Target, Trophy, Zap, Heart, Megaphone } from 'lucide-react';
import AppShell from '@/components/AppShell';
import Composer from './Composer';
import PostActions from '@/components/PostActions';

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

const GRADIENTS = [
  'linear-gradient(135deg,#ff6b2b,#a855f7)',
  'linear-gradient(135deg,#ff3d00,#ff6b2b)',
  'linear-gradient(135deg,#a855f7,#ec4899)',
  'linear-gradient(135deg,#22c55e,#10b981)',
  'linear-gradient(135deg,#eab308,#ff6b2b)',
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
      .select('id, content, created_at, post_type, photo_url, latitude, longitude, profiles(username), quests(id, title, photo_url, cash_reward)')
      .order('created_at', { ascending: false }).limit(30),
    supabase.from('quests')
      .select('id, title, photo_url, cash_reward, difficulty, total_attempts')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(6),
  ]);

  const profile = profileRes.data;
  const activeQuests = progressRes.data || [];
  const posts = postsRes.data || [];
  const featured = featuredRes.data || [];

  // Beğenileri ayrı çek — post_likes tablosu yoksa feed yine de çalışır
  const likeCount: Record<string, number> = {};
  const likedByMe = new Set<string>();
  if (posts.length) {
    const { data: likeRows } = await supabase
      .from('post_likes')
      .select('post_id, user_id')
      .in('post_id', posts.map((p) => p.id));
    for (const row of likeRows || []) {
      likeCount[row.post_id] = (likeCount[row.post_id] || 0) + 1;
      if (row.user_id === user.id) likedByMe.add(row.post_id);
    }
  }

  /* ── SAĞ PANEL ─────────────────────────────────────────── */
  const aside = (
    <div className="pt-2 space-y-4">
      {/* Arama */}
      <div className="rounded-2xl px-4 py-3 flex items-center gap-2"
        style={{ background: '#eff3f4' }}>
        <span style={{ color: '#536471' }}>🔍</span>
        <span className="text-sm" style={{ color: '#536471' }}>Görev ara...</span>
      </div>

      {/* Öne çıkan görevler — X "Neler oluyor?" kutusu gibi */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #eff3f4' }}>
        <div className="px-4 py-3">
          <h2 className="font-black text-xl" style={{ color: '#0f1419' }}>Gündemdekiler</h2>
        </div>
        {featured.slice(0, 5).map((q) => (
          <Link key={q.id} href={`/quest/${q.id}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            style={{ borderTop: '1px solid #eff3f4' }}>
            <div className="flex-1 min-w-0">
              <p className="text-xs" style={{ color: '#536471' }}>Görev · {q.total_attempts || 0} deneme</p>
              <p className="font-bold text-sm truncate" style={{ color: '#0f1419' }}>{q.title}</p>
              {q.cash_reward > 0 && <p className="text-xs font-bold" style={{ color: '#22c55e' }}>{q.cash_reward}₺ ödül</p>}
            </div>
            {q.photo_url && <img src={q.photo_url} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" alt="" />}
          </Link>
        ))}
        <div className="px-4 py-3" style={{ borderTop: '1px solid #eff3f4' }}>
          <Link href="/" className="text-sm font-semibold" style={{ color: '#ff6b2b' }}>Daha fazla göster</Link>
        </div>
      </div>

      {/* Aktif görevler */}
      {activeQuests.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #eff3f4' }}>
          <div className="px-4 py-3">
            <h2 className="font-black text-xl" style={{ color: '#0f1419' }}>Devam Edenler</h2>
          </div>
          {activeQuests.map((p) => {
            const q = pick(p.quests);
            return (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3"
                style={{ borderTop: '1px solid #eff3f4' }}>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: '#0f1419' }}>{q?.title}</p>
                  <p className="text-xs" style={{ color: '#536471' }}>Adım {p.current_step}</p>
                </div>
                <Link href={`/quest/${q?.id}`}
                  className="px-4 py-1.5 rounded-full text-xs font-black text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
                  Devam
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <AppShell aside={aside}>
      {/* Sticky tab bar — X gibi */}
      <div className="sticky top-0 z-10 backdrop-blur-md"
        style={{ background: 'rgba(255,255,255,0.85)', borderBottom: '1px solid #eff3f4' }}>
        <div className="flex">
          <button className="flex-1 py-4 text-sm font-bold" style={{ color: '#0f1419', borderBottom: '2px solid #ff6b2b' }}>
            Sana Özel
          </button>
          <Link href="/" className="flex-1 py-4 text-sm font-bold text-center" style={{ color: '#536471' }}>
            Görevler
          </Link>
        </div>
      </div>

      {/* Çalışan compose kutusu — paylaşım + iyilik hareketi */}
      <Composer />

      {/* Stats bar */}
      <div className="flex items-center gap-0 px-4 py-3" style={{ borderBottom: '1px solid #eff3f4' }}>
        {[
          { icon: <Target size={14} />, val: profile?.total_finds || 0, label: 'Buldu', c: '#ff6b2b' },
          { icon: <Trophy size={14} />, val: profile?.total_wins || 0, label: 'Kazandı', c: '#22c55e' },
          { icon: <Zap size={14} />, val: activeQuests.length, label: 'Aktif', c: '#a855f7' },
        ].map((s, i) => (
          <div key={i} className="flex-1 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: s.c + '15', color: s.c }}>
              {s.icon}
            </div>
            <div>
              <span className="font-black text-lg" style={{ color: '#0f1419' }}>{s.val}</span>
              <span className="text-xs ml-1" style={{ color: '#536471' }}>{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Feed — Tweet tarzı */}
      {posts.length === 0 ? (
        <div className="p-16 text-center">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-xl font-black mb-1" style={{ color: '#0f1419' }}>Henüz aktivite yok</p>
          <p className="text-sm mb-5" style={{ color: '#536471' }}>İlk görevi tamamlayan sen ol!</p>
          <Link href="/"
            className="px-6 py-3 rounded-full text-white font-bold"
            style={{ background: '#ff6b2b' }}>
            Görevlere Git
          </Link>
        </div>
      ) : (
        posts.map((post, idx) => {
          const p = pick(post.profiles);
          const q = pick(post.quests);
          const isGood = post.post_type === 'good_deed';
          const isAnnounce = post.post_type === 'announcement';
          const isWin = post.post_type === 'quest_complete';
          return (
            <article key={post.id}
              className="flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
              style={{ borderBottom: '1px solid #eff3f4', background: isAnnounce ? 'rgba(255,107,43,0.04)' : isGood ? 'rgba(236,72,153,0.03)' : undefined }}>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white flex-shrink-0 text-sm"
                style={{ background: isAnnounce ? 'linear-gradient(135deg,#ff6b2b,#ff3d00)' : isGood ? 'linear-gradient(135deg,#ec4899,#a855f7)' : GRADIENTS[idx % GRADIENTS.length] }}>
                {isAnnounce ? <Megaphone size={18} /> : isGood ? <Heart size={18} /> : p?.username?.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="font-bold text-sm" style={{ color: '#0f1419' }}>@{p?.username}</span>
                  {isGood && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(236,72,153,0.1)', color: '#ec4899' }}>💗 İyilik</span>}
                  {isAnnounce && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,107,43,0.1)', color: '#ff6b2b' }}>📢 Duyuru</span>}
                  {isWin && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a' }}>🏆 Kazandı</span>}
                  <span style={{ color: '#536471' }}>·</span>
                  <span className="text-sm" style={{ color: '#536471' }}>{timeAgo(post.created_at)}</span>
                </div>

                {/* Content */}
                <p className="text-sm mt-0.5 leading-relaxed" style={{ color: '#0f1419' }}>
                  {post.content}
                </p>

                {/* Post fotoğrafı (iyilik/sosyal) */}
                {post.photo_url && (
                  <div className="mt-3 rounded-2xl overflow-hidden" style={{ height: 280, border: '1px solid #eff3f4', background: '#f7f8f8' }}>
                    <img src={post.photo_url} className="w-full h-full object-cover" alt="" />
                  </div>
                )}

                {/* Quest card — X retweet kutusu gibi */}
                {q?.photo_url && (
                  <Link href={`/quest/${q.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 block rounded-2xl overflow-hidden transition-opacity hover:opacity-90"
                    style={{ border: '1px solid #eff3f4' }}>
                    <img src={q.photo_url} className="w-full object-cover" style={{ maxHeight: 280 }} alt="" />
                    <div className="px-3 py-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold" style={{ color: '#0f1419' }}>{q.title}</p>
                        {q.cash_reward > 0 && <p className="text-xs font-bold" style={{ color: '#22c55e' }}>{q.cash_reward}₺ ödül</p>}
                      </div>
                      <span className="text-xs font-black px-3 py-1.5 rounded-full text-white" style={{ background: '#ff6b2b' }}>Bul →</span>
                    </div>
                  </Link>
                )}

                {/* Actions — çalışan beğeni + konum */}
                <PostActions
                  postId={post.id}
                  initialLikes={likeCount[post.id] || 0}
                  initialLiked={likedByMe.has(post.id)}
                  latitude={post.latitude}
                  longitude={post.longitude}
                />
              </div>
            </article>
          );
        })
      )}
    </AppShell>
  );
}
