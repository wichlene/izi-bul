'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PostActions from '@/components/PostActions';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Post {
  id: string;
  post_type: string;
  content: string;
  photo_url: string | null;
  created_at: string;
  quest_id?: string | null;
  profiles?: { username?: string; avatar_url?: string | null } | null;
  quests?: { title?: string; photo_url?: string } | null;
  like_count: number;
  liked_by_me: boolean;
  comment_count: number;
}

const typeInfo = (type: string) => {
  if (type === 'good_deed') return { icon: '💗', text: 'İyilik', color: '#ec4899' };
  if (type === 'quest_complete') return { icon: '🏆', text: 'Kazandı', color: '#f59e0b' };
  if (type === 'announcement') return { icon: '📢', text: 'Duyuru', color: '#3b82f6' };
  return { icon: '💬', text: 'Paylaşım', color: '#536471' };
};

export default function UserProfilePosts({ userId }: { userId: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/posts?user_id=${userId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { setPosts(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="p-16 text-center text-sm" style={{ color: '#536471' }}>Yükleniyor...</div>;

  if (posts.length === 0) return (
    <div className="p-16 text-center">
      <div className="text-5xl mb-3">📭</div>
      <p className="text-sm" style={{ color: '#536471' }}>Henüz paylaşım yok.</p>
    </div>
  );

  return (
    <div>
      {posts.map((p) => {
        const info = typeInfo(p.post_type);
        return (
          <div key={p.id} className="px-4 py-4" style={{ borderBottom: '1px solid #eff3f4' }}>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: info.color + '18', color: info.color }}>
                {info.icon} {info.text}
              </span>
              <span className="text-xs" style={{ color: '#8b98a5' }}>
                {formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: tr })}
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#0f1419' }}>{p.content}</p>
            {p.photo_url && (
              <div className="mt-2 rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <img src={p.photo_url} className="w-full h-full object-contain" style={{ background: '#f7f8f8' }} alt="" />
              </div>
            )}
            {p.quests && p.quest_id && (
              <Link href={`/quest/${p.quest_id}`}
                className="mt-2 flex items-center gap-2 p-2 rounded-xl"
                style={{ background: '#f7f8f8', border: '1px solid #eff3f4' }}>
                {p.quests.photo_url && <img src={p.quests.photo_url} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" alt="" />}
                <span className="text-xs font-semibold" style={{ color: '#ff6b2b' }}>{p.quests.title}</span>
              </Link>
            )}
            <PostActions postId={p.id} initialLikes={p.like_count} initialLiked={p.liked_by_me} initialCommentCount={p.comment_count} />
          </div>
        );
      })}
    </div>
  );
}
