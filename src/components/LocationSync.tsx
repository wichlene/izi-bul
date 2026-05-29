'use client';

import { useEffect } from 'react';

export default function LocationSync({ userId }: { userId: string }) {
  useEffect(() => {
    if (!navigator.geolocation) return;

    let watchId: number | null = null;

    const saveLocation = async (pos: GeolocationPosition) => {
      await fetch('/api/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      });
    };

    watchId = navigator.geolocation.watchPosition(
      saveLocation,
      () => {},
      { enableHighAccuracy: false, maximumAge: 20000, timeout: 15000 }
    );

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      fetch('/api/location', { method: 'DELETE' });
    };
  }, [userId]);

  return null;
}
