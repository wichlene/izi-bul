'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, MessageSquare, Loader2, ImagePlus, X, MapPin } from 'lucide-react';
import PhotoUpload from '@/components/PhotoUpload';

interface UserSuggest { id: string; username: string }

export default function Composer() {
  const router = useRouter();
  const [type, setType] = useState<'social' | 'good_deed'>('social');
  const [content, setContent] = useState('');
  const [photo, setPhoto] = useState('');
  const [showPhoto, setShowPhoto] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [postError, setPostError] = useState('');
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');

  // @mention dropdown
  const [mentionResults, setMentionResults] = useState<UserSuggest[]>([]);
  const [mentionWord, setMentionWord] = useState(''); // "@abc" şeklindeki kelime
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    // Cursor öncesi son kelimeyi bul
    const pos = e.target.selectionStart ?? val.length;
    const before = val.slice(0, pos);
    const match = before.match(/@(\w*)$/);
    if (match) {
      const query = match[1];
      setMentionWord(match[0]); // "@abc"
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        if (query.length === 0) { setMentionResults([]); return; }
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        if (res.ok) setMentionResults(await res.json());
      }, 200);
    } else {
      setMentionWord('');
      setMentionResults([]);
    }
  }, []);

  const pickMention = (username: string) => {
    // Mevcut @word'ü @username ile değiştir
    const pos = textareaRef.current?.selectionStart ?? content.length;
    const before = content.slice(0, pos);
    const after = content.slice(pos);
    const replaced = before.replace(/@\w*$/, `@${username} `);
    setContent(replaced + after);
    setMentionResults([]);
    setMentionWord('');
    textareaRef.current?.focus();
  };

  const post = async () => {
    if (!content.trim() || loading) return;
    setPostError('');
    setLoading(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, post_type: type, photo_url: photo || null, latitude: coords?.lat ?? null, longitude: coords?.lng ?? null }),
      });
      if (res.ok) {
        setContent(''); setPhoto(''); setShowPhoto(false); setCoords(null); router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setPostError(data.error || `Paylaşım başarısız (${res.status}). Tekrar dene.`);
      }
    } catch {
      setPostError('Bağlantı hatası. İnternet bağlantını kontrol et.');
    } finally {
      setLoading(false);
    }
  };

  const addLocation = () => {
    setLocError('');
    if (coords) { setCoords(null); return; }
    if (!navigator.geolocation) { setLocError('Tarayıcın konumu desteklemiyor.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocating(false); },
      (err) => {
        setLocating(false);
        setLocError(err.code === err.PERMISSION_DENIED ? 'Konum izni reddedildi.' : 'Konum alınamadı.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="px-4 py-4 relative" style={{ borderBottom: '1px solid #eff3f4' }}>
      {/* Tip seçici */}
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

      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          rows={2}
          placeholder={type === 'good_deed'
            ? 'Bir iyilik paylaş... @birini etiketle, #konu ekle'
            : 'Neler keşfediyorsun? @birini etiketle, #konu ekle'}
          maxLength={500}
          className="w-full text-base resize-none focus:outline-none"
          style={{ color: '#0f1419', background: 'transparent' }}
        />

        {/* @mention dropdown */}
        {mentionResults.length > 0 && (
          <div className="absolute left-0 right-0 z-50 rounded-xl overflow-hidden shadow-lg"
            style={{ top: '100%', background: '#fff', border: '1px solid #eff3f4' }}>
            {mentionResults.map((u) => (
              <button key={u.id} onMouseDown={() => pickMention(u.username)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#ff6b2b,#a855f7)' }}>
                  {u.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold" style={{ color: '#0f1419' }}>@{u.username}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {showPhoto && <div className="my-2"><PhotoUpload onUpload={setPhoto} /></div>}

      <div className="flex items-center justify-between mt-2">
        <div className="flex gap-1">
          <button onClick={() => setShowPhoto((v) => !v)} className="p-2 rounded-full hover:bg-orange-50" style={{ color: '#ff6b2b' }}>
            <ImagePlus size={18} />
          </button>
          <button onClick={addLocation} disabled={locating}
            className="p-2 rounded-full hover:bg-green-50 flex items-center gap-1 text-xs font-semibold disabled:opacity-60"
            style={{ color: coords ? '#22c55e' : '#536471' }}>
            {locating ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
            {locating ? 'Alınıyor...' : coords ? 'Konum eklendi' : ''}
            {coords && <X size={12} onClick={(e) => { e.stopPropagation(); setCoords(null); }} />}
          </button>
        </div>
        <button onClick={post} disabled={!content.trim() || loading}
          className="px-5 py-2 rounded-full text-sm font-black text-white disabled:opacity-40"
          style={{ background: type === 'good_deed' ? 'linear-gradient(135deg,#ec4899,#a855f7)' : 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
          {loading ? <Loader2 size={15} className="animate-spin" /> : 'Paylaş'}
        </button>
      </div>
      {locError && <p className="text-xs mt-2" style={{ color: '#ef4444' }}>{locError}</p>}
      {postError && (
        <div className="mt-2 px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}>
          {postError}
        </div>
      )}
    </div>
  );
}
