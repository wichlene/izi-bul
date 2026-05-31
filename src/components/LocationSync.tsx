'use client';

import { useEffect, useRef } from 'react';

const NEARBY_CHECK_INTERVAL = 5 * 60_000; // 5 dakikada bir

export default function LocationSync({ userId }: { userId: string }) {
  const lastNearbyCheck = useRef(0);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const pushLocation = (lat: number, lng: number) => {
      fetch('/api/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      }).catch(() => {});
    };

    const checkNearby = (lat: number, lng: number) => {
      const now = Date.now();
      if (now - lastNearbyCheck.current < NEARBY_CHECK_INTERVAL) return;
      lastNearbyCheck.current = now;
      fetch('/api/push/nearby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      }).catch(() => {});
    };

    const onPosition = (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords;
      pushLocation(latitude, longitude);
      checkNearby(latitude, longitude);
    };

    const watchId = navigator.geolocation.watchPosition(
      onPosition,
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );

    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        onPosition,
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
      );
    }, 30_000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(interval);
      fetch('/api/location', { method: 'DELETE' }).catch(() => {});
    };
  }, [userId]);

  return null;
}
