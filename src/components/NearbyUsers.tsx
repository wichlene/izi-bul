'use client';

import { useEffect, useState } from 'react';
import { calculateDistance, formatDistance } from '@/lib/distance';
import { Navigation, Loader2 } from 'lucide-react';

interface LiveUser {
  user_id: string;
  username?: string;
  latitude: number;
  longitude: number;
}

interface Props {
  liveUsers: LiveUser[];
}

export default function NearbyUsers({ liveUsers }: Props) {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) { setTimeout(() => setLoading(false)); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => { setPos({ lat: p.coords.latitude, lng: p.coords.longitude }); setLoading(false); },
      () => setLoading(false),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);

  const sorted = pos
    ? [...liveUsers]
        .map((u) => ({ ...u, dist: calculateDistance(pos.lat, pos.lng, u.latitude, u.longitude) }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 10)
    : [];

  const GRADIENTS = [
    'linear-gradient(135deg,#ff6b2b,#a855f7)',
    'linear-gradient(135deg,#ff3d00,#ff6b2b)',
    'linear-gradient(135deg,#a855f7,#ec4899)',
    'linear-gradient(135deg,#22c55e,#10b981)',
    'linear-gradient(135deg,#eab308,#ff6b2b)',
  ];

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #eff3f4' }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #eff3f4' }}>
        <Navigation size={15} style={{ color: '#ff6b2b' }} />
        <div>
          <h2 className="font-black text-sm" style={{ color: '#0f1419' }}>Yakındakiler</h2>
          <p className="text-xs" style={{ color: '#536471' }}>Aktif kullanıcılar</p>
        </div>
        {sorted.length > 0 && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold"
            style={{ background: 'rgba(255,107,43,0.1)', color: '#ff6b2b' }}>
            {sorted.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="px-4 py-4 flex justify-center">
          <Loader2 size={16} className="animate-spin" style={{ color: '#536471' }} />
        </div>
      ) : !pos ? (
        <p className="px-4 py-3 text-xs" style={{ color: '#536471' }}>Konum izni gerekli</p>
      ) : sorted.length === 0 ? (
        <p className="px-4 py-3 text-xs" style={{ color: '#536471' }}>Yakında aktif kullanıcı yok</p>
      ) : sorted.map((u, i) => (
        <div key={u.user_id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
          style={{ borderTop: '1px solid #eff3f4' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
            style={{ background: GRADIENTS[i % GRADIENTS.length] }}>
            {(u.username || '?').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate" style={{ color: '#0f1419' }}>@{u.username || 'kullanıcı'}</p>
            <p className="text-[10px]" style={{ color: '#536471' }}>{formatDistance(u.dist)} uzakta</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
