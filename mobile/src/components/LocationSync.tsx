import { useEffect } from 'react';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';

export default function LocationSync({ userId }: { userId: string }) {
  useEffect(() => {
    let watchSub: Location.LocationSubscription | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let active = true;

    const push = async (lat: number, lng: number) => {
      if (!active) return;
      supabase.from('live_locations').upsert({
        user_id: userId,
        latitude: lat,
        longitude: lng,
        updated_at: new Date().toISOString(),
      }).then(() => {});
    };

    const start = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!active || status !== 'granted') return;

      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        push(pos.coords.latitude, pos.coords.longitude);
      } catch {}

      try {
        watchSub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 15000, distanceInterval: 20 },
          (loc) => push(loc.coords.latitude, loc.coords.longitude)
        );
      } catch {}

      intervalId = setInterval(async () => {
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          push(loc.coords.latitude, loc.coords.longitude);
        } catch {}
      }, 30000);
    };

    start();

    return () => {
      active = false;
      watchSub?.remove();
      if (intervalId) clearInterval(intervalId);
      supabase.from('live_locations').delete().eq('user_id', userId).then(() => {});
    };
  }, [userId]);

  return null;
}
