'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, MapPin, ImagePlus, Loader2, X } from 'lucide-react';
import PhotoUpload from '@/components/PhotoUpload';

interface Post {
  id: string;
  content: string;
  photo_url: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  profiles: { username: string } | null;
}

function timeAgo(date: string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}dk`;
  if (s < 86400) return `${Math.floor(s / 3600)}sa`;
  return `${Math.floor(s / 86400)}g`;
}

export default function GoodDeedClient() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [photo, setPhoto] = useState('');
  const [showPhoto, setShowPhoto] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [posting, setPosting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');

  useEffect(() => {
    fetch('/api/posts?type=good_deed')
      .then((r) => r.json())
      .then((data) => { setPosts(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const addLocation = () => {
    setLocError('');
    if (coords) { setCoords(null); return; }
    if (!navigator.geolocation) {
      setLocError('Tarayıcın konumu desteklemiyor.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setLocError(
          err.code === err.PERMISSION_DENIED
            ? 'Konum izni reddedildi. Tarayıcı ayarlarından izin ver.'
            : 'Konum alınamadı, tekrar dene.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const post = async () => {
    if (!content.trim() || posting) return;
    setPosting(true);
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, post_type: 'good_deed', photo_url: photo || null, latitude: coords?.lat, longitude: coords?.lng }),
    });
    if (res.ok) {
      const newPost = await res.json();
      setPosts((prev) => [newPost, ...prev]);
      setContent('');
      setPhoto('');
      setShowPhoto(false);
      setCoords(null);
      router.refresh();
    }
    setPosting(false);
  };

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-md px-4 py-4"
        style={{ background: 'rgba(255,255,255,0.9)', borderBottom: '1px solid #eff3f4' }}>
        <h1 className="text-xl font-black flex items-center gap-2" style={{ color: '#0f1419' }}>
          <Heart size={22} style={{ color: '#ec4899' }} fill="#ec4899" />
          İyilik Hareketi
        </h1>
        <p className="text-xs mt-0.5" style={{ color: '#536471' }}>
          Etrafındaki ihtiyaç sahiplerini duyur, iyilik paylaş
        </p>
      </div>

      {/* Compose */}
      <div className="px-4 py-4" style={{ borderBottom: '1px solid #eff3f4' }}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder='Bir iyilik paylaş: "Şu köşeye mama bıraktım 🐱", "Burada yardıma ihtiyaç var", "Kedi buldum gelip bakın"...'
          maxLength={500}
          className="w-full text-base resize-none focus:outline-none"
          style={{ color: '#0f1419', background: 'transparent' }}
        />
        {showPhoto && (
          <div className="my-2"><PhotoUpload onUpload={setPhoto} /></div>
        )}
        <div className="flex items-center justify-between mt-2">
          <div className="flex gap-1">
            <button onClick={() => setShowPhoto((v) => !v)}
              className="p-2 rounded-full hover:bg-pink-50" style={{ color: '#ec4899' }}>
              <ImagePlus size={18} />
            </button>
            <button onClick={addLocation} disabled={locating}
              className="p-2 rounded-full hover:bg-pink-50 flex items-center gap-1.5 text-xs font-semibold disabled:opacity-60"
              style={{ color: coords ? '#22c55e' : '#ec4899' }}>
              {locating ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
              {locating ? 'Konum alınıyor...' : coords ? 'Konum eklendi' : 'Konum ekle'}
              {coords && <X size={12} />}
            </button>
          </div>
          <button onClick={post} disabled={!content.trim() || posting}
            className="px-5 py-2 rounded-full text-sm font-black text-white disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#ec4899,#a855f7)' }}>
            {posting ? <Loader2 size={15} className="animate-spin" /> : 'Paylaş 💗'}
          </button>
        </div>
        {locError && (
          <p className="text-xs mt-2 px-1" style={{ color: '#ef4444' }}>{locError}</p>
        )}
        {coords && (
          <p className="text-xs mt-2 px-1" style={{ color: '#22c55e' }}>
            📍 Konum eklendi: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </p>
        )}
      </div>

      {/* Feed */}
      {loading ? (
        <div className="p-16 text-center">
          <Loader2 size={28} className="mx-auto animate-spin" style={{ color: '#ec4899' }} />
        </div>
      ) : posts.length === 0 ? (
        <div className="p-16 text-center">
          <Heart size={48} className="mx-auto mb-4" style={{ color: '#eff3f4' }} />
          <p className="text-xl font-black mb-1" style={{ color: '#0f1419' }}>Henüz iyilik yok</p>
          <p className="text-sm" style={{ color: '#536471' }}>İlk iyiliği paylaşan sen ol!</p>
        </div>
      ) : posts.map((p) => (
        <article key={p.id} className="flex gap-3 px-4 py-4 hover:bg-gray-50 transition-colors"
          style={{ borderBottom: '1px solid #eff3f4', background: 'rgba(236,72,153,0.02)' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white flex-shrink-0 text-sm"
            style={{ background: 'linear-gradient(135deg,#ec4899,#a855f7)' }}>
            {p.profiles?.username?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm" style={{ color: '#0f1419' }}>@{p.profiles?.username}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(236,72,153,0.1)', color: '#ec4899' }}>💗 İyilik</span>
              <span className="text-sm" style={{ color: '#536471' }}>· {timeAgo(p.created_at)}</span>
            </div>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: '#0f1419' }}>{p.content}</p>
            {p.photo_url && (
              <img src={p.photo_url} className="mt-3 rounded-2xl w-full object-cover"
                style={{ maxHeight: 400, border: '1px solid #eff3f4' }} alt="" />
            )}
            {p.latitude && p.longitude && (
              <a
                href={`https://maps.google.com/?q=${p.latitude},${p.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a' }}>
                <MapPin size={12} /> Konumu Gör
              </a>
            )}
          </div>
        </article>
      ))}
    </>
  );
}
