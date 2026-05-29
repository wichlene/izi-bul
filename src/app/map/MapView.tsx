'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Quest } from '@/types';
import { createClient } from '@/lib/supabase/client';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

interface LiveUser {
  user_id: string;
  latitude: number;
  longitude: number;
  username?: string;
}

interface Props {
  initialQuests: Quest[];
  initialLiveUsers?: LiveUser[];
  questCount?: number;
}

export default function MapView({ initialQuests, initialLiveUsers = [], questCount = 0 }: Props) {
  const [quests] = useState<Quest[]>(initialQuests);
  const [liveUsers, setLiveUsers] = useState<LiveUser[]>(initialLiveUsers);

  const fetchLiveUsers = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('live_locations')
      .select('user_id, latitude, longitude, profiles(username)')
      .limit(200);

    if (data) {
      const mapped = data.map((u) => {
        const raw = u as unknown as { user_id: string; latitude: number; longitude: number; profiles: { username: string } | { username: string }[] | null };
        const prof = Array.isArray(raw.profiles) ? raw.profiles[0] : raw.profiles;
        return { user_id: raw.user_id, latitude: raw.latitude, longitude: raw.longitude, username: prof?.username };
      });
      setLiveUsers(mapped);
    }
  };

  useEffect(() => {
    void fetchLiveUsers();
    const interval = setInterval(() => void fetchLiveUsers(), 8000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full h-full relative">
      {/* Overlay — client-side güncel sayı */}
      <div className="absolute top-4 left-4 z-[1000]">
        <div className="rounded-2xl px-4 py-3 shadow-lg" style={{ background: '#ffffff', border: '1px solid #eff3f4' }}>
          <div className="font-bold text-sm mb-1" style={{ color: '#0f1419' }}>🗺️ Türkiye Haritası</div>
          <div className="text-xs" style={{ color: '#536471' }}>{questCount} aktif görev</div>
          <div className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: '#22c55e' }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
            {liveUsers.length} oyuncu online
          </div>
        </div>
      </div>

      <MapPicker
        readOnly
        initialLat={39.0}
        initialLng={35.0}
        zoom={6}
        quests={quests.map((q) => ({
          id: q.id,
          latitude: q.latitude,
          longitude: q.longitude,
          title: q.title,
          category: q.category,
        }))}
        liveUsers={liveUsers}
      />
    </div>
  );
}
