'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Quest, Category, DIFFICULTIES } from '@/types';
import { calculateDistance } from '@/lib/distance';
import QuestCard from '@/components/QuestCard';
import PostActions from '@/components/PostActions';
import { Search, Flame, Clock, Coins, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import NotificationBell from '@/components/NotificationBell';

interface DailyQuest {
  id: string; title: string; photo_url: string; difficulty: string;
  points: number; cash_reward: number; total_solved: number; region?: string;
}

function DailyBanner() {
  const [quest, setQuest] = useState<DailyQuest | null | undefined>(undefined);

  useEffect(() => {
    fetch('/api/quests/daily')
      .then(r => r.ok ? r.json() : null)
      .then(d => setQuest(d || null))
      .catch(() => setQuest(null));
  }, []);

  if (quest === undefined || quest === null) return null;

  const diff = DIFFICULTIES[quest.difficulty as keyof typeof DIFFICULTIES];
  const now = new Date();
  const midnight = new Date(now); midnight.setHours(24, 0, 0, 0);
  const secsLeft = Math.floor((midnight.getTime() - now.getTime()) / 1000);
  const h = Math.floor(secsLeft / 3600);
  const m = Math.floor((secsLeft % 3600) / 60);

  return (
    <Link href={`/quest/${quest.id}`} className="block mx-3 mt-3 rounded-2xl overflow-hidden group"
      style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
      <div className="relative">
        <img src={quest.photo_url} alt={quest.title}
          className="w-full h-32 object-cover opacity-25 group-hover:opacity-35 transition-opacity" />
        <div className="absolute inset-0 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.35)' }}>
              <Flame size={12} className="text-white" />
              <span className="text-[11px] font-black text-white tracking-wide">GÜNÜN GÖREVİ</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.35)' }}>
              <Clock size={11} className="text-white" />
              <span className="text-[11px] font-bold text-white">{h}s {m}dk</span>
            </div>
          </div>
          <div>
            <h2 className="text-white font-black text-base leading-tight mb-1">{quest.title}</h2>
            <div className="flex items-center gap-2 flex-wrap">
              {quest.region && <span className="text-[11px] text-white opacity-80">{quest.region}</span>}
              {diff && <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: diff.color + '55' }}>{diff.label}</span>}
              <span className="text-[11px] text-white font-black">{quest.points}p{quest.cash_reward > 0 ? ` +${quest.cash_reward}₺` : ''}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

interface Post {
  id: string;
  post_type: string;
  content: string;
  photo_url?: string | null;
  created_at: string;
  quest_id?: string | null;
  user_id?: string;
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
  const [showSearch, setShowSearch] = useState(false);

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
      {/* ── MOBİL HEADER ── */}
      <div className="sticky top-0 z-20 md:hidden" style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #eff3f4' }}>
        {showSearch ? (
          <div className="flex items-center gap-2 px-3 h-14">
            <button onClick={() => { setShowSearch(false); setSearch(''); }} className="p-2 -ml-1 flex-shrink-0" style={{ color: '#536471' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Görev, bölge, içerik ara..."
              className="flex-1 text-sm focus:outline-none bg-transparent"
              style={{ color: '#0f1419' }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="p-1.5 flex-shrink-0" style={{ color: '#8e9aab' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <span className="text-base font-black" style={{ color: '#0f1419' }}>İzi Bul</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowSearch(true)} className="w-10 h-10 flex items-center justify-center rounded-full" style={{ color: '#536471' }}>
                <Search size={20} />
              </button>
              <Link href="/notifications" className="w-10 h-10 flex items-center justify-center rounded-full">
                <NotificationBell />
              </Link>
            </div>
          </div>
        )}

        {/* Filtre chipleri */}
        <div className="flex gap-2 px-3 pb-2.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {chips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => setFilter(chip.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all"
              style={filter === chip.id
                ? { background: '#ff6b2b', color: '#fff' }
                : { background: '#f3f4f6', color: '#536471' }}>
              <span>{chip.icon}</span>
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── MASAÜSTÜ HEADER ── */}
      <div className="hidden md:block sticky top-0 z-10 px-4 pt-3 pb-2"
        style={{ background: 'rgba(255,255,255,0.95)', borderBottom: '1px solid #eff3f4', backdropFilter: 'blur(8px)' }}>
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
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
        {/* Masaüstü filtre chipleri */}
        <div className="flex gap-2 mt-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {chips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => setFilter(chip.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all"
              style={filter === chip.id
                ? { background: '#ff6b2b', color: '#fff' }
                : { background: '#f3f4f6', color: '#536471' }}>
              <span>{chip.icon}</span>
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Günlük Görev Banner */}
      <DailyBanner />

      {/* Feed */}
      <div className="p-3 space-y-3">
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
                <Link href={`/user/${post.user_id || '#'}`}>
                  <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-base"
                    style={{ background: '#f7f8f8', border: '1px solid #eff3f4' }}>
                    {post.profiles?.avatar_url
                      ? <img src={post.profiles.avatar_url} className="w-full h-full object-cover" alt="" />
                      : <span>👤</span>}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <Link href={`/user/${post.user_id || '#'}`} className="font-bold text-sm hover:underline" style={{ color: '#0f1419' }}>
                      @{post.profiles?.username || 'kullanıcı'}
                    </Link>
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
                    <div className="mt-2 rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
                      <img src={post.photo_url} className="w-full h-full object-contain" style={{ background: '#f7f8f8' }} alt="" />
                    </div>
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
