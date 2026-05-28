'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Quest } from '@/types';
import { createClient } from '@/lib/supabase/client';
import LiveLocationTracker from '@/components/LiveLocationTracker';

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
  userId?: string;
}

export default function MapView({ initialQuests, initialLiveUsers = [], userId }: Props) {
  const [quests] = useState<Quest[]>(initialQuests);
  const [liveUsers, setLiveUsers] = useState<LiveUser[]>(initialLiveUsers);

  const fetchLiveUsers = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('live_locations')
      .select('user_id, latitude, longitude, profiles(username)')
      .limit(100);

    if (data) {
      const mapped = data.map((u) => {
        const raw = u as unknown as { user_id: string; latitude: number; longitude: number; profiles: { username: string } | { username: string }[] | null };
        const prof = Array.isArray(raw.profiles) ? raw.profiles[0] : raw.profiles;
        return { user_id: raw.user_id, latitude: raw.latitude, longitude: raw.longitude, username: prof?.username };
      });
      setTimeout(() => setLiveUsers(mapped), 0);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchLiveUsers();
    const interval = setInterval(() => { void fetchLiveUsers(); }, 10000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full h-full">
      {userId && <LiveLocationTracker userId={userId} />}
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
