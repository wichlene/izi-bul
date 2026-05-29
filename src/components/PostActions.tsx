'use client';

import { useState } from 'react';
import { Heart, MapPin } from 'lucide-react';

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

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    // İyimser güncelleme
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
        // Geri al
        setLiked(liked);
        setLikes((n) => n + (optimisticLiked ? -1 : 1));
      }
    } catch {
      setLiked(liked);
      setLikes((n) => n + (optimisticLiked ? -1 : 1));
    }
    setBusy(false);
  };

  return (
    <div className="flex items-center gap-5 mt-3">
      <button onClick={toggle}
        className="flex items-center gap-1.5 transition-colors group"
        style={{ color: liked ? '#ef4444' : '#536471' }}>
        <Heart size={18} fill={liked ? '#ef4444' : 'none'}
          className={liked ? '' : 'group-hover:text-red-500 transition-colors'} />
        <span className="text-xs font-semibold">{likes}</span>
      </button>

      {latitude != null && longitude != null && (
        <a href={`https://maps.google.com/?q=${latitude},${longitude}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a' }}>
          <MapPin size={13} /> Konumu Gör
        </a>
      )}
    </div>
  );
}
