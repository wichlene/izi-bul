'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Heart, MapPin, ImagePlus, Loader2, X, Navigation, Map as MapIcon, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import PhotoUpload from '@/components/PhotoUpload';
import PostActions from '@/components/PostActions';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

interface Post {
  id: string;
  content: string;
  photo_url: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  profiles: { username: string } | { username: string }[] | null;
  like_count?: number;
  liked_by_me?: boolean;
  comment_count?: number;
  user_id?: string;
}

function pickUsername(p: Post['profiles']): string {
  if (!p) return '?';
  return (Array.isArray(p) ? p[0]?.username : p.username) || '?';
}

function timeAgo(date: string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}dk`;
  if (s < 86400) return `${Math.floor(s / 3600)}sa`;
  return `${Math.floor(s / 86400)}g`;
}

export default function GoodDeedClient({ currentUserId }: { currentUserId: string | null }) {
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
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 39.0, lng: 35.0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/posts?type=good_deed')
      .then((r) => r.json())
      .then((data) => { setPosts(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Telefonun GPS konumunu kullan
  const useMyLocation = () => {
    setLocError('');
    if (!navigator.geolocation) {
      setLocError('Tarayıcın konumu desteklemiyor.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const c = { lat: p.coords.latitude, lng: p.coords.longitude };
        setCoords(c);
        setMapCenter(c);
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

  // Haritadan seç — modal aç, mümkünse mevcut konuma odakla
  const openMap = () => {
    setLocError('');
    setShowMap(true);
    if (!coords && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setMapCenter({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => {},
        { timeout: 6000 }
      );
    }
  };

  const loadPosts = () => {
    fetch('/api/posts?type=good_deed')
      .then((r) => r.json())
      .then((data) => setPosts(data || []))
      .catch(() => {});
  };

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

  const post = async () => {
    if (!content.trim() || posting) return;
    setPosting(true);
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, post_type: 'good_deed', photo_url: photo || null, latitude: coords?.lat, longitude: coords?.lng }),
    });
    if (res.ok) {
      setContent('');
      setPhoto('');
      setShowPhoto(false);
      setCoords(null);
      loadPosts(); // sunucudan taze veri çek
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
        {/* Konum seçenekleri */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <button onClick={useMyLocation} disabled={locating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold disabled:opacity-60"
            style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a' }}>
            {locating ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
            Konumumu kullan
          </button>
          <button onClick={openMap}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(59,130,246,0.1)', color: '#2563eb' }}>
            <MapIcon size={14} /> Haritadan seç
          </button>
          {coords && (
            <button onClick={() => setCoords(null)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: '#f7f8f8', color: '#536471' }}>
              <X size={12} /> Konumu kaldır
            </button>
          )}
        </div>

        {locError && <p className="text-xs mt-2 px-1" style={{ color: '#ef4444' }}>{locError}</p>}
        {coords && (
          <p className="text-xs mt-2 px-1 flex items-center gap-1" style={{ color: '#22c55e' }}>
            <MapPin size={12} /> Konum seçildi: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </p>
        )}

        <div className="flex items-center justify-between mt-3">
          <button onClick={() => setShowPhoto((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-pink-50"
            style={{ background: 'rgba(236,72,153,0.08)', color: '#ec4899' }}>
            <ImagePlus size={16} /> {showPhoto ? 'Fotoğrafı gizle' : 'Fotoğraf ekle'}
          </button>
          <button onClick={post} disabled={!content.trim() || posting}
            className="px-5 py-2 rounded-full text-sm font-black text-white disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#ec4899,#a855f7)' }}>
            {posting ? <Loader2 size={15} className="animate-spin" /> : 'Paylaş 💗'}
          </button>
        </div>
      </div>

      {/* Harita seçim modalı */}
      {showMap && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col" style={{ background: '#fff', maxHeight: '85vh' }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #eff3f4' }}>
              <div>
                <h3 className="font-bold text-sm" style={{ color: '#0f1419' }}>Konumu haritadan seç</h3>
                <p className="text-xs" style={{ color: '#536471' }}>Haritaya dokun veya işareti sürükle</p>
              </div>
              <button onClick={() => setShowMap(false)} className="p-1.5 rounded-full hover:bg-gray-100" style={{ color: '#536471' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ height: 380 }}>
              <MapPicker
                initialLat={coords?.lat ?? mapCenter.lat}
                initialLng={coords?.lng ?? mapCenter.lng}
                zoom={coords || mapCenter.lat !== 39.0 ? 15 : 6}
                onLocationSelect={(lat, lng) => setCoords({ lat, lng })}
              />
            </div>
            <div className="px-4 py-3 flex items-center justify-between gap-3" style={{ borderTop: '1px solid #eff3f4' }}>
              <span className="text-xs" style={{ color: coords ? '#22c55e' : '#536471' }}>
                {coords ? `📍 ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : 'Henüz nokta seçilmedi'}
              </span>
              <button onClick={() => setShowMap(false)} disabled={!coords}
                className="px-5 py-2 rounded-full text-sm font-black text-white disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#ec4899,#a855f7)' }}>
                Bu konumu kullan
              </button>
            </div>
          </div>
        </div>
      )}

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
            {pickUsername(p.profiles).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm" style={{ color: '#0f1419' }}>@{pickUsername(p.profiles)}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(236,72,153,0.1)', color: '#ec4899' }}>💗 İyilik</span>
              <span className="text-sm" style={{ color: '#536471' }}>· {timeAgo(p.created_at)}</span>
              {currentUserId && p.user_id === currentUserId ? (
                <div className="ml-auto relative">
                  <button onClick={() => setMenuOpenId(menuOpenId === p.id ? null : p.id)}
                    className="p-1 rounded-full hover:bg-gray-100" style={{ color: '#8b98a5' }}>
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
              ) : null}
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
              <p className="text-sm mt-1 leading-relaxed" style={{ color: '#0f1419' }}>{p.content}</p>
            )}
            {p.photo_url && (
              <div className="mt-3 rounded-2xl overflow-hidden" style={{ height: 300, border: '1px solid #eff3f4', background: '#f7f8f8' }}>
                <img src={p.photo_url} className="w-full h-full object-cover" alt="" />
              </div>
            )}
            <PostActions
              postId={p.id}
              initialLikes={p.like_count || 0}
              initialLiked={p.liked_by_me || false}
              initialCommentCount={p.comment_count || 0}
              latitude={p.latitude}
              longitude={p.longitude}
            />
          </div>
        </article>
      ))}
    </>
  );
}
