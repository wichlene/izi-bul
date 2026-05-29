'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LocationSync({ userId }: { userId: string }) {
  const supabase = useRef(createClient());

  useEffect(() => {
    if (!navigator.geolocation) return;

    let watchId: number | null = null;

    const saveLocation = async (pos: GeolocationPosition) => {
      const { error } = await supabase.current.from('live_locations').upsert({
        user_id: userId,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (error) {
        // Session might not be ready yet, retry after re-auth check
        const { data: { session } } = await supabase.current.auth.getSession();
        if (!session) return;
        await supabase.current.from('live_locations').upsert({
          user_id: userId,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      }
    };

    const startWatch = () => {
      watchId = navigator.geolocation.watchPosition(
        saveLocation,
        () => {}, // permission denied or unavailable — silent
        { enableHighAccuracy: false, maximumAge: 20000, timeout: 15000 }
      );
    };

    // Small delay so Supabase auth cookies are ready
    const timer = setTimeout(startWatch, 1000);

    return () => {
      clearTimeout(timer);
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      supabase.current.from('live_locations').delete().eq('user_id', userId);
    };
  }, [userId]);

  return null;
}
