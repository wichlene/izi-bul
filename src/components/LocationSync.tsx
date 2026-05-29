'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LocationSync({ userId }: { userId: string }) {
  useEffect(() => {
    if (!navigator.geolocation) return;

    const supabase = createClient();
    let watchId: number;

    const start = () => {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          supabase.from('live_locations').upsert({
            user_id: userId,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 }
      );
    };

    // Önce permission durumunu kontrol et, varsa direkt başlat
    navigator.permissions?.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'granted' || result.state === 'prompt') start();
      result.addEventListener('change', () => {
        if (result.state === 'granted') start();
      });
    }).catch(() => start());

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      supabase.from('live_locations').delete().eq('user_id', userId);
    };
  }, [userId]);

  return null;
}
