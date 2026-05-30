'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Search, Navigation, Loader2, X } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false });

interface Props {
  lat: number | null;
  lng: number | null;
  onSelect: (lat: number, lng: number) => void;
  height?: string;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

export default function LocationPicker({ lat, lng, onSelect, height = 'h-72' }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 3) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=tr`,
        { headers: { 'Accept-Language': 'tr' } }
      );
      const data = await res.json();
      setResults(data);
    } catch { setResults([]); }
    setSearching(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  const getLiveLocation = () => {
    setGpsError('');
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onSelect(pos.coords.latitude, pos.coords.longitude);
        setGpsLoading(false);
      },
      () => { setGpsError('Konum alınamadı, izin vermelisin.'); setGpsLoading(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const pickResult = (r: SearchResult) => {
    onSelect(parseFloat(r.lat), parseFloat(r.lon));
    setQuery(r.display_name.split(',').slice(0, 2).join(','));
    setResults([]);
  };

  return (
    <div className="space-y-2">
      {/* Üst araçlar */}
      <div className="flex gap-2">
        {/* Arama */}
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#536471' }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Adres veya yer ara... (ör: Galata Kulesi)"
            className="w-full rounded-xl pl-9 pr-8 py-2.5 text-sm focus:outline-none"
            style={{ background: '#f7f8f8', border: '1px solid #eff3f4', color: '#0f1419' }}
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); }} className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: '#536471' }}>
              <X size={13} />
            </button>
          )}
          {/* Arama sonuçları */}
          {results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-[2000] shadow-lg" style={{ background: '#fff', border: '1px solid #eff3f4' }}>
              {results.map((r, i) => (
                <button key={i} onClick={() => pickResult(r)}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 flex items-start gap-2"
                  style={{ borderBottom: i < results.length - 1 ? '1px solid #eff3f4' : 'none', color: '#0f1419' }}>
                  <MapPin size={12} className="shrink-0 mt-0.5" style={{ color: '#ff6b2b' }} />
                  <span className="line-clamp-2 leading-snug">{r.display_name}</span>
                </button>
              ))}
            </div>
          )}
          {searching && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl p-3 text-sm text-center z-[2000]" style={{ background: '#fff', border: '1px solid #eff3f4', color: '#536471' }}>
              <Loader2 size={14} className="animate-spin inline mr-1" /> Aranıyor...
            </div>
          )}
        </div>

        {/* GPS butonu */}
        <button
          onClick={getLiveLocation}
          disabled={gpsLoading}
          title="Şu anki konumumu al"
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold shrink-0 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)', color: '#fff' }}>
          {gpsLoading ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
          <span className="hidden sm:inline">Konumum</span>
        </button>
      </div>

      {gpsError && <p className="text-xs" style={{ color: '#ef4444' }}>{gpsError}</p>}

      {/* Harita */}
      <div className={`${height} rounded-xl overflow-hidden relative`} style={{ border: '1px solid #eff3f4' }}>
        <MapPicker
          onLocationSelect={onSelect}
          initialLat={lat || undefined}
          initialLng={lng || undefined}
          zoom={lat ? 15 : 6}
        />
      </div>

      {lat && lng && (
        <p className="text-xs flex items-center gap-1" style={{ color: '#22c55e' }}>
          <MapPin size={11} /> {lat.toFixed(5)}, {lng.toFixed(5)} — seçildi
        </p>
      )}
    </div>
  );
}
