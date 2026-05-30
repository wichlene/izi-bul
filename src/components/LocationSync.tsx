'use client';

import { useEffect } from 'react';

export default function LocationSync({ userId }: { userId: string }) {
  useEffect(() => {
    if (!navigator.geolocation) return;

    const push = (lat: number, lng: number) => {
      fetch('/api/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      }).catch(() => {});
    };

    const watchId = navigator.geolocation.watchPosition(
      (pos) => push(pos.coords.latitude, pos.coords.longitude),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );

    // watchPosition bazen arka planda durduğu için 30sn'de bir yedek
    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => push(pos.coords.latitude, pos.coords.longitude),
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
