'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, MessageSquare, Loader2, ImagePlus, X } from 'lucide-react';
import PhotoUpload from '@/components/PhotoUpload';

export default function Composer({ initial }: { initial?: string }) {
  const router = useRouter();
  const [type, setType] = useState<'social' | 'good_deed'>('social');
  const [content, setContent] = useState('');
  const [photo, setPhoto] = useState('');
  const [showPhoto, setShowPhoto] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const post = async () => {
    if (!content.trim() || loading) return;
    setLoading(true);
    const res = await fetch('/api/posts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, post_type: type, photo_url: photo || null, latitude: coords?.lat, longitude: coords?.lng }),
    });
    setLoading(false);
    if (res.ok) { setContent(''); setPhoto(''); setShowPhoto(false); setCoords(null); router.refresh(); }
  };

  const addLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }));
  };

  return (
    <div className="px-4 py-4" style={{ borderBottom: '1px solid #eff3f4' }}>
      <div className="flex gap-2 mb-3">
        <button onClick={() => setType('social')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors"
          style={type === 'social' ? { background: 'rgba(255,107,43,0.1)', color: '#ff6b2b' } : { background: '#f7f8f8', color: '#536471' }}>
          <MessageSquare size={14} /> Paylaşım
        </button>
        <button onClick={() => setType('good_deed')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors"
          style={type === 'good_deed' ? { background: 'rgba(236,72,153,0.1)', color: '#ec4899' } : { background: '#f7f8f8', color: '#536471' }}>
          <Heart size={14} /> İyilik Hareketi
        </button>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={2}
        placeholder={type === 'good_deed' ? 'Bir iyilik paylaş: "Şu köşeye mama bıraktım", "Burada yardıma ihtiyaç var"...' : 'Neler keşfediyorsun?'}
        maxLength={500}
        className="w-full text-base resize-none focus:outline-none"
        style={{ color: '#0f1419', background: 'transparent' }}
      />

      {showPhoto && (
        <div className="my-2"><PhotoUpload onUpload={setPhoto} /></div>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex gap-1">
          <button onClick={() => setShowPhoto((v) => !v)} className="p-2 rounded-full hover:bg-orange-50" style={{ color: '#ff6b2b' }}>
            <ImagePlus size={18} />
          </button>
          {type === 'good_deed' && (
            <button onClick={addLocation} className="p-2 rounded-full hover:bg-pink-50 flex items-center gap-1 text-xs font-semibold" style={{ color: coords ? '#22c55e' : '#ec4899' }}>
              📍 {coords ? 'Konum eklendi' : 'Konum ekle'}
              {coords && <X size={12} onClick={(e) => { e.stopPropagation(); setCoords(null); }} />}
            </button>
          )}
        </div>
        <button onClick={post} disabled={!content.trim() || loading}
          className="px-5 py-2 rounded-full text-sm font-black text-white disabled:opacity-40"
          style={{ background: type === 'good_deed' ? 'linear-gradient(135deg,#ec4899,#a855f7)' : 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
          {loading ? <Loader2 size={15} className="animate-spin" /> : 'Paylaş'}
        </button>
      </div>
    </div>
  );
}
