'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PostActions from '@/components/PostActions';
import { MoreHorizontal, Edit2, Trash2, Calendar, Grid3x3 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Quest } from '@/types';
import { Submission } from '@/types';

interface Post {
  id: string;
  post_type: string;
  content: string;
  photo_url: string | null;
  created_at: string;
  quest_id?: string | null;
  user_id: string;
  profiles?: { username?: string; avatar_url?: string | null } | null;
  quests?: { title?: string; photo_url?: string } | null;
  like_count: number;
  liked_by_me: boolean;
  comment_count: number;
}

interface Props {
  userId: string;
  submissions: (Submission & { quest: Quest & { cash_reward: number } })[];
}

const typeInfo = (type: string) => {
  if (type === 'good_deed') return { icon: '💗', text: 'İyilik', color: '#ec4899' };
  if (type === 'quest_complete') return { icon: '🏆', text: 'Kazandı', color: '#f59e0b' };
  if (type === 'announcement') return { icon: '📢', text: 'Duyuru', color: '#3b82f6' };
  return { icon: '💬', text: 'Paylaşım', color: '#536471' };
};

export default function ProfilePosts({ userId, submissions }: Props) {
  const [tab, setTab] = useState<'posts' | 'history'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    fetch(`/api/posts?user_id=${userId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { setPosts(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  const deletePost = async (id: string) => {
    if (!confirm('Bu gönderiyi silmek istiyor musun?')) return;
    const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== id));
    setMenuOpenId(null);
  };

  const startEdit = (p: Post) => {
    setEditingId(p.id);
    setEditContent(p.content);
    setMenuOpenId(null);
  };

  const saveEdit = async () => {
    if (!editingId || !editContent.trim()) return;
    const res = await fetch(`/api/posts/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editContent }),
    });
    if (res.ok) {
      setPosts((prev) => prev.map((p) => p.id === editingId ? { ...p, content: editContent.trim() } : p));
      setEditingId(null);
    }
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex" style={{ borderBottom: '1px solid #eff3f4' }}>
        <button
          onClick={() => setTab('posts')}
          className="flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors"
          style={{
            color: tab === 'posts' ? '#0f1419' : '#536471',
            borderBottom: tab === 'posts' ? '2px solid #ff6b2b' : '2px solid transparent',
          }}
        >
          <Grid3x3 size={16} /> Paylaşımlar
        </button>
        <button
          onClick={() => setTab('history')}
          className="flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors"
          style={{
            color: tab === 'history' ? '#0f1419' : '#536471',
            borderBottom: tab === 'history' ? '2px solid #ff6b2b' : '2px solid transparent',
          }}
        >
          <Calendar size={16} /> Geçmiş ({submissions.length})
        </button>
      </div>

      {/* Posts Tab */}
      {tab === 'posts' && (
        <div>
          {loading ? (
            <div className="p-16 text-center text-sm" style={{ color: '#536471' }}>Yükleniyor...</div>
          ) : posts.length === 0 ? (
            <div className="p-16 text-center">
              <div className="text-5xl mb-3">📭</div>
              <p className="font-bold mb-1" style={{ color: '#0f1419' }}>Henüz paylaşım yok</p>
              <p className="text-sm" style={{ color: '#536471' }}>İyilik hareketi bölümünden paylaşım yapabilirsin.</p>
            </div>
          ) : posts.map((p) => {
            const info = typeInfo(p.post_type);
            return (
              <div key={p.id} className="px-4 py-4" style={{ borderBottom: '1px solid #eff3f4' }}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: info.color + '18', color: info.color }}>
                        {info.icon} {info.text}
                      </span>
                      <span className="text-xs" style={{ color: '#8b98a5' }}>
                        {formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: tr })}
                      </span>
                      <div className="ml-auto relative">
                        <button
                          onClick={() => setMenuOpenId(menuOpenId === p.id ? null : p.id)}
                          className="p-1 rounded-full hover:bg-gray-100"
                          style={{ color: '#8b98a5' }}
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        {menuOpenId === p.id && (
                          <div className="absolute right-0 top-7 z-20 rounded-xl shadow-lg overflow-hidden"
                            style={{ background: '#fff', border: '1px solid #eff3f4', minWidth: 140 }}>
                            <button onClick={() => startEdit(p)}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 text-left"
                              style={{ color: '#0f1419' }}>
                              <Edit2 size={14} /> Düzenle
                            </button>
                            <button onClick={() => deletePost(p.id)}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-red-50 text-left"
                              style={{ color: '#ef4444' }}>
                              <Trash2 size={14} /> Sil
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {editingId === p.id ? (
                      <div className="mt-1">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          maxLength={500}
                          className="w-full text-sm resize-none focus:outline-none rounded-xl px-3 py-2"
                          style={{ background: '#f7f8f8', border: '1px solid #eff3f4', color: '#0f1419' }}
                        />
                        <div className="flex gap-2 mt-1">
                          <button onClick={saveEdit}
                            className="px-4 py-1.5 rounded-full text-xs font-bold text-white"
                            style={{ background: '#ff6b2b' }}>Kaydet</button>
                          <button onClick={() => setEditingId(null)}
                            className="px-4 py-1.5 rounded-full text-xs font-bold"
                            style={{ background: '#f7f8f8', color: '#536471' }}>İptal</button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed" style={{ color: '#0f1419' }}>{p.content}</p>
                    )}

                    {p.photo_url && (
                      <div className="mt-2 rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
                        <img src={p.photo_url} className="w-full h-full object-contain" style={{ background: '#f7f8f8' }} alt="" />
                      </div>
                    )}
                    {p.quests && p.quest_id && (
                      <Link href={`/quest/${p.quest_id}`}
                        className="mt-2 flex items-center gap-2 p-2 rounded-xl"
                        style={{ background: '#f7f8f8', border: '1px solid #eff3f4' }}>
                        {p.quests.photo_url && (
                          <img src={p.quests.photo_url} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" alt="" />
                        )}
                        <span className="text-xs font-semibold" style={{ color: '#ff6b2b' }}>{p.quests.title}</span>
                      </Link>
                    )}
                    <PostActions
                      postId={p.id}
                      initialLikes={p.like_count}
                      initialLiked={p.liked_by_me}
                      initialCommentCount={p.comment_count}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div>
          {submissions.length === 0 ? (
            <div className="p-16 text-center">
              <p className="mb-4 text-sm" style={{ color: '#536471' }}>Henüz hiç deneme yapmadın.</p>
              <Link href="/" className="inline-block px-5 py-2.5 rounded-full font-bold text-white text-sm" style={{ background: '#ff6b2b' }}>
                Görevlere Bak
              </Link>
            </div>
          ) : submissions.map((s) => (
            <Link key={s.id} href={`/quest/${s.quest.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              style={{ borderBottom: '1px solid #eff3f4' }}>
              <img src={s.quest.photo_url} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" alt="" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: '#0f1419' }}>{s.quest.title}</div>
                <div className="text-xs" style={{ color: '#536471' }}>
                  {formatDistanceToNow(new Date(s.created_at), { addSuffix: true, locale: tr })} · {s.distance_meters}m
                </div>
              </div>
              {s.is_winner ? (
                <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                  ✅ Kazandı
                </span>
              ) : s.status === 'pending' ? (
                <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: 'rgba(234,179,8,0.1)', color: '#ca8a04' }}>
                  ⏳ İnceleniyor
                </span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: '#f7f8f8', color: '#536471' }}>Uzak</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
