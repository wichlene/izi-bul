'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Quest, Category } from '@/types';
import { calculateDistance } from '@/lib/distance';
import QuestCard from '@/components/QuestCard';
import PostActions from '@/components/PostActions';
import { Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Post {
  id: string;
  post_type: string;
  content: string;
  photo_url?: string | null;
  created_at: string;
  quest_id?: string | null;
  profiles?: { username?: string; avatar_url?: string | null } | null;
  quests?: { title?: string; photo_url?: string; cash_reward?: number } | null;
  like_count: number;
  liked_by_me: boolean;
  comment_count: number;
  latitude?: number | null;
  longitude?: number | null;
}

type FeedItem =
  | { kind: 'quest'; quest: Quest; distance?: number; created_at: string }
  | { kind: 'post'; post: Post; created_at: string };

interface Props {
  quests: Quest[];
  categories: Category[];
}

export default function DashboardHome({ quests, categories }: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setUserPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    fetch('/api/posts')
      .then((r) => (r.ok ? r.json() : []))
      .then(setPosts)
      .catch(() => {});
  }, []);

  const feed = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [];
    for (const q of quests) {
      const distance = userPos
        ? Math.round(calculateDistance(userPos.lat, userPos.lng, q.latitude, q.longitude))
        : undefined;
      items.push({ kind: 'quest', quest: q, distance, created_at: q.created_at });
    }
    for (const p of posts) {
      items.push({ kind: 'post', post: p, created_at: p.created_at });
    }
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return items;
  }, [quests, posts, userPos]);

  const filtered = useMemo(() => {
    let items = feed;
    if (filter === 'quests') {
      items = items.filter((i) => i.kind === 'quest');
    } else if (filter === 'good_deed') {
      items = items.filter((i) => i.kind === 'post' && i.post.post_type === 'good_deed');
    } else if (filter === 'quest_complete') {
      items = items.filter((i) => i.kind === 'post' && i.post.post_type === 'quest_complete');
    } else if (filter !== 'all') {
      items = items.filter((i) => i.kind !== 'quest' || i.quest.category_id === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((i) => {
        if (i.kind === 'quest') {
          return (
            i.quest.title.toLowerCase().includes(q) ||
            (i.quest.description || '').toLowerCase().includes(q) ||
            (i.quest.region || '').toLowerCase().includes(q) ||
            (i.quest.category?.name || '').toLowerCase().includes(q)
          );
        }
        return (
          (i.post.content || '').toLowerCase().includes(q) ||
          (i.post.profiles?.username || '').toLowerCase().includes(q)
        );
      });
    }
    return items;
  }, [feed, filter, search]);

  const chips = [
    { id: 'all', label: 'Tümü', icon: '✨' },
    { id: 'quests', label: 'Görevler', icon: '🗺️' },
    { id: 'good_deed', label: 'İyilik', icon: '💗' },
    { id: 'quest_complete', label: 'Kazandı', icon: '🏆' },
    ...categories.map((c) => ({ id: c.id, label: c.name, icon: c.icon })),
  ];

  return (
    <div>
      <div className="sticky top-0 z-10 px-4 pt-3 pb-2"
        style={{ background: 'rgba(255,255,255,0.95)', borderBottom: '1px solid #eff3f4', backdropFilter: 'blur(8px)' }}>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#8b98a5' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Görev, iyilik, bölge ara..."
            className="w-full pl-9 pr-4 py-2.5 rounded-full text-sm focus:outline-none"
            style={{ background: '#f7f8f8', border: '1px solid #eff3f4', color: '#0f1419' }}
          />
        </div>
      </div>

      <div className="p-4 space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🔍</div>
            <p style={{ color: '#536471' }}>Sonuç bulunamadı.</p>
          </div>
        )}

        {filtered.map((item) => {
          if (item.kind === 'quest') {
            return <QuestCard key={`q-${item.quest.id}`} quest={item.quest} distance={item.distance} />;
          }

          const post = item.post;
          const typeInfo =
            post.post_type === 'good_deed'
              ? { icon: '💗', text: 'İyilik', color: '#ec4899' }
              : post.post_type === 'quest_complete'
              ? { icon: '🏆', text: 'Kazandı', color: '#f59e0b' }
              : post.post_type === 'announcement'
              ? { icon: '📢', text: 'Duyuru', color: '#3b82f6' }
              : { icon: '💬', text: 'Paylaşım', color: '#536471' };

          return (
            <div key={`p-${post.id}`} className="rounded-2xl p-4"
              style={{ background: '#ffffff', border: '1px solid #eff3f4' }}>
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-base"
                  style={{ background: '#f7f8f8', border: '1px solid #eff3f4' }}>
                  {post.profiles?.avatar_url
                    ? <img src={post.profiles.avatar_url} className="w-full h-full object-cover" alt="" />
                    : <span>👤</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="font-bold text-sm" style={{ color: '#0f1419' }}>
                      @{post.profiles?.username || 'kullanıcı'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: typeInfo.color + '18', color: typeInfo.color }}>
                      {typeInfo.icon} {typeInfo.text}
                    </span>
                    <span className="text-xs ml-auto" style={{ color: '#8b98a5' }}>
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: tr })}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#0f1419' }}>{post.content}</p>
                  {post.photo_url && (
                    <img src={post.photo_url} className="mt-2 rounded-xl w-full max-h-60 object-cover" alt="" />
                  )}
                  {post.quests && post.quest_id && (
                    <Link href={`/quest/${post.quest_id}`}
                      className="mt-2 flex items-center gap-2 p-2 rounded-xl"
                      style={{ background: '#f7f8f8', border: '1px solid #eff3f4' }}>
                      {post.quests.photo_url && (
                        <img src={post.quests.photo_url} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" alt="" />
                      )}
                      <span className="text-xs font-semibold" style={{ color: '#ff6b2b' }}>{post.quests.title}</span>
                    </Link>
                  )}
                  <PostActions
                    postId={post.id}
                    initialLikes={post.like_count}
                    initialLiked={post.liked_by_me}
                    initialCommentCount={post.comment_count}
                    latitude={post.latitude}
                    longitude={post.longitude}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
