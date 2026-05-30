import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Heart, Megaphone } from 'lucide-react';
import AppShell from '@/components/AppShell';
import Composer from './Composer';
import PostActions from '@/components/PostActions';
import { renderContent } from '@/lib/renderContent';

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

  const [postsRes, recentActivityRes] = await Promise.all([
    supabase.from('posts')
      .select('id, content, created_at, post_type, photo_url, latitude, longitude, profiles(username), quests(id, title, photo_url, cash_reward)')
      .order('created_at', { ascending: false }).limit(30),
    supabase.from('posts')
      .select('id, content, created_at, post_type, profiles(username)')
      .order('created_at', { ascending: false }).limit(10),
  ]);

  const posts = postsRes.data || [];
  const recentActivity = recentActivityRes.data || [];

  const likeCount: Record<string, number> = {};
  const likedByMe = new Set<string>();
  const commentCount: Record<string, number> = {};
  if (posts.length) {
    const ids = posts.map((p) => p.id);
    const [likeRes, commentRes] = await Promise.all([
      supabase.from('post_likes').select('post_id, user_id').in('post_id', ids),
      supabase.from('post_comments').select('post_id').in('post_id', ids),
    ]);
    for (const row of likeRes.data || []) {
      likeCount[row.post_id] = (likeCount[row.post_id] || 0) + 1;
      if (row.user_id === user.id) likedByMe.add(row.post_id);
    }
    for (const row of commentRes.data || []) {
      commentCount[row.post_id] = (commentCount[row.post_id] || 0) + 1;
    }
  }

  /* ── SAĞ PANEL ─────────────────────────────────────────── */
  const aside = (
    <div className="pt-2 space-y-4">
      {/* Anlık Faaliyetler */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #eff3f4' }}>
        <div className="px-4 py-3">
          <h2 className="font-black text-xl" style={{ color: '#0f1419' }}>Anlık Faaliyetler</h2>
          <p className="text-xs mt-0.5" style={{ color: '#536471' }}>Son paylaşımlar</p>
        </div>
        {recentActivity.length === 0 ? (
          <p className="px-4 py-3 text-sm" style={{ color: '#536471' }}>Henüz aktivite yok.</p>
        ) : recentActivity.map((a) => {
          const ap = pick(a.profiles);
          const isGood = a.post_type === 'good_deed';
          const isAnnounce = a.post_type === 'announcement';
          return (
            <div key={a.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              style={{ borderTop: '1px solid #eff3f4' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                style={{ background: isAnnounce ? 'linear-gradient(135deg,#ff6b2b,#ff3d00)' : isGood ? 'linear-gradient(135deg,#ec4899,#a855f7)' : 'linear-gradient(135deg,#ff6b2b,#a855f7)' }}>
                {isAnnounce ? '📢' : isGood ? '💗' : ap?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: '#0f1419' }}>@{ap?.username}</p>
                <p className="text-xs mt-0.5 line-clamp-2 leading-snug" style={{ color: '#536471' }}>
                  {renderContent(a.content)}
                </p>
                <p className="text-[10px] mt-1" style={{ color: '#8e8e8e' }}>{timeAgo(a.created_at)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <AppShell aside={aside}>
      {/* Compose kutusu */}
      <Composer />

      {/* Feed */}
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
                  {renderContent(post.content)}
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
                  initialCommentCount={commentCount[post.id] || 0}
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
