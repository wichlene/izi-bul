'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Share2, MapPin } from 'lucide-react';

interface Props {
  postId: string;
  initialLikes: number;
  initialLiked: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

export default function PostActions({ postId, initialLikes, initialLiked, latitude, longitude }: Props) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(initialLiked);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    const optimisticLiked = !liked;
    setLiked(optimisticLiked);
    setLikes((n) => n + (optimisticLiked ? 1 : -1));
    try {
      const res = await fetch('/api/posts/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId }),
      });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikes(data.count);
      } else {
        setLiked(liked);
        setLikes((n) => n + (optimisticLiked ? -1 : 1));
      }
    } catch {
      setLiked(liked);
      setLikes((n) => n + (optimisticLiked ? -1 : 1));
    }
    setBusy(false);
  };

  const share = async () => {
    const url = `${window.location.origin}/dashboard#${postId}`;
    try {
      if (navigator.share) {
        await navigator.share({ url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch { /* iptal edildi */ }
  };

  return (
    <div className="flex items-center gap-5 mt-3">
      {/* Yorum — placeholder */}
      <button className="flex items-center gap-1.5 transition-colors" style={{ color: '#536471' }}>
        <MessageCircle size={18} />
        <span className="text-xs font-semibold">0</span>
      </button>

      {/* Beğeni */}
      <button onClick={toggle} disabled={busy}
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
  );
}
