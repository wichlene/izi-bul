'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  userId: string;
}

export default function LiveLocationTracker({ userId }: Props) {
  useEffect(() => {
    if (!navigator.geolocation) return;

    const supabase = createClient();

    const update = (pos: GeolocationPosition) => {
      supabase.from('live_locations').upsert({
        user_id: userId,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    };

    const watchId = navigator.geolocation.watchPosition(update, () => {}, {
      enableHighAccuracy: true,
      maximumAge: 10000,
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
      supabase.from('live_locations').delete().eq('user_id', userId);
    };
  }, [userId]);

  return null;
}
