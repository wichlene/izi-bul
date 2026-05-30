'use client';

import { useState, useRef, useCallback } from 'react';
import { Heart, MessageCircle, Share2, MapPin, Send, X } from 'lucide-react';

interface UserSuggest { id: string; username: string }

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: { username: string } | { username: string }[] | null;
}

interface Props {
  postId: string;
  initialLikes: number;
  initialLiked: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

function pickUsername(p: Comment['profiles']): string {
  if (!p) return '?';
  return (Array.isArray(p) ? p[0]?.username : p.username) || '?';
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}dk`;
  if (s < 86400) return `${Math.floor(s / 3600)}sa`;
  return `${Math.floor(s / 86400)}g`;
}

export default function PostActions({ postId, initialLikes, initialLiked, latitude, longitude }: Props) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(initialLiked);
  const [likeBusy, setLikeBusy] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);

  const [copied, setCopied] = useState(false);

  // @mention for comments
  const [mentionResults, setMentionResults] = useState<UserSuggest[]>([]);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCommentChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCommentInput(val);
    const pos = e.target.selectionStart ?? val.length;
    const before = val.slice(0, pos);
    const match = before.match(/@(\w*)$/);
    if (match) {
      const query = match[1];
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        if (query.length === 0) { setMentionResults([]); return; }
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        if (res.ok) setMentionResults(await res.json());
      }, 200);
    } else {
      setMentionResults([]);
    }
  }, []);

  const pickCommentMention = (username: string) => {
    const pos = commentInputRef.current?.selectionStart ?? commentInput.length;
    const before = commentInput.slice(0, pos);
    const after = commentInput.slice(pos);
    const replaced = before.replace(/@\w*$/, `@${username} `);
    setCommentInput(replaced + after);
    setMentionResults([]);
    commentInputRef.current?.focus();
  };

  // ── Beğeni ──
  const toggleLike = async () => {
    if (likeBusy) return;
    setLikeBusy(true);
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    try {
      const res = await fetch('/api/posts/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId }),
      });
      if (res.ok) {
        const d = await res.json();
        setLiked(d.liked);
        setLikes(d.count);
      } else {
        setLiked(liked); setLikes((n) => n + (next ? -1 : 1));
      }
    } catch {
      setLiked(liked); setLikes((n) => n + (next ? -1 : 1));
    }
    setLikeBusy(false);
  };

  // ── Yorumlar aç/kapat ──
  const toggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next && !commentsLoaded) {
      const res = await fetch(`/api/posts/comment?post_id=${postId}`);
      if (res.ok) {
        const data: Comment[] = await res.json();
        setComments(data);
        setCommentCount(data.length);
        setCommentsLoaded(true);
      }
    }
  };

  // ── Yorum gönder ──
  const submitComment = async () => {
    if (!commentInput.trim() || commentBusy) return;
    setCommentBusy(true);
    const res = await fetch('/api/posts/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, content: commentInput.trim() }),
    });
    if (res.ok) {
      const c: Comment = await res.json();
      setComments((prev) => [...prev, c]);
      setCommentCount((n) => n + 1);
      setCommentInput('');
    }
    setCommentBusy(false);
  };

  // ── Paylaş ──
  const share = async () => {
    const url = `${window.location.origin}/dashboard`;
    try {
      if (navigator.share) await navigator.share({ url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch { /* iptal */ }
  };

  return (
    <div>
      {/* Aksiyon satırı */}
      <div className="flex items-center gap-5 mt-3">
        {/* Yorum */}
        <button onClick={toggleComments}
          className="flex items-center gap-1.5 transition-colors"
          style={{ color: showComments ? '#ff6b2b' : '#536471' }}>
          <MessageCircle size={18} fill={showComments ? 'rgba(255,107,43,0.15)' : 'none'} />
          <span className="text-xs font-semibold">{commentCount || 0}</span>
        </button>

        {/* Beğeni */}
        <button onClick={toggleLike} disabled={likeBusy}
          className="flex items-center gap-1.5 transition-colors group"
          style={{ color: liked ? '#ef4444' : '#536471' }}>
          <Heart size={18} fill={liked ? '#ef4444' : 'none'}
            className={liked ? '' : 'group-hover:text-red-400 transition-colors'} />
          <span className="text-xs font-semibold">{likes}</span>
        </button>

        {/* Paylaş */}
        <button onClick={share}
          className="flex items-center gap-1.5 transition-colors"
          style={{ color: copied ? '#22c55e' : '#536471' }}>
          <Share2 size={18} />
          {copied && <span className="text-xs font-semibold">Kopyalandı!</span>}
        </button>

        {/* Konum */}
        {latitude != null && longitude != null && (
          <a href={`https://maps.google.com/?q=${latitude},${longitude}`}
            target="_blank" rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a' }}>
            <MapPin size={12} /> Konum
          </a>
        )}
      </div>

      {/* Yorum bölümü */}
      {showComments && (
        <div className="mt-3 rounded-2xl overflow-hidden" style={{ border: '1px solid #eff3f4', background: '#f7f8f8' }}>
          {/* Yorum listesi */}
          {comments.length === 0 ? (
            <p className="px-4 py-3 text-xs" style={{ color: '#8e8e8e' }}>İlk yorumu sen yap!</p>
          ) : (
            <div className="max-h-48 overflow-y-auto">
              {comments.map((c) => (
                <div key={c.id} className="px-4 py-2.5 flex gap-2.5" style={{ borderBottom: '1px solid #eff3f4' }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0 mt-0.5"
                    style={{ background: 'linear-gradient(135deg,#ff6b2b,#a855f7)' }}>
                    {pickUsername(c.profiles).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-bold" style={{ color: '#0f1419' }}>@{pickUsername(c.profiles)}</span>
                      <span className="text-[10px]" style={{ color: '#8e8e8e' }}>{timeAgo(c.created_at)}</span>
                    </div>
                    <p className="text-sm mt-0.5 leading-snug" style={{ color: '#0f1419' }}>{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Yorum input */}
          <div className="relative">
            {mentionResults.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 z-50 rounded-xl overflow-hidden shadow-lg mb-1"
                style={{ background: '#fff', border: '1px solid #eff3f4' }}>
                {mentionResults.map((u) => (
                  <button key={u.id} onMouseDown={() => pickCommentMention(u.username)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#ff6b2b,#a855f7)' }}>
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold" style={{ color: '#0f1419' }}>@{u.username}</span>
                  </button>
                ))}
              </div>
            )}
          <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderTop: comments.length ? '1px solid #eff3f4' : undefined, background: '#fff' }}>
            <input
              ref={commentInputRef}
              value={commentInput}
              onChange={handleCommentChange}
              onKeyDown={(e) => e.key === 'Enter' && submitComment()}
              placeholder="Yorum ekle... @birini etiketle"
              maxLength={280}
              className="flex-1 text-sm focus:outline-none bg-transparent"
              style={{ color: '#0f1419' }}
            />
            {commentInput.trim() ? (
              <button onClick={submitComment} disabled={commentBusy}
                className="flex-shrink-0 p-1.5 rounded-full disabled:opacity-50"
                style={{ color: '#ff6b2b' }}>
                <Send size={16} />
              </button>
            ) : (
              <button onClick={() => setShowComments(false)} className="flex-shrink-0 p-1.5 rounded-full" style={{ color: '#8e8e8e' }}>
                <X size={14} />
              </button>
            )}
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
