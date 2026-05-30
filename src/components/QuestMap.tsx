'use client';

import { useEffect, useRef } from 'react';

interface Props {
  userLat: number | null;
  userLng: number | null;
  targetLat: number;
  targetLng: number;
  radiusMeters: number;
  inRange?: boolean;
}

export default function QuestMap({ userLat, userLng, targetLat, targetLng, radiusMeters, inRange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const userMarkerRef = useRef<import('leaflet').CircleMarker | null>(null);
  const circleRef = useRef<import('leaflet').Circle | null>(null);
  const initialFitDone = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;
    let mounted = true;

    import('leaflet').then((mod) => {
      if (!mounted || !containerRef.current || mapRef.current) return;
      const L = mod.default;

      // Remove existing attribution to avoid duplicates on HMR
      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      // Target circle (approach area — orange)
      const circle = L.circle([targetLat, targetLng], {
        radius: radiusMeters,
        color: inRange ? '#22c55e' : '#ff6b2b',
        fillColor: inRange ? '#22c55e' : '#ff6b2b',
        fillOpacity: 0.12,
        weight: 2.5,
        dashArray: '6 4',
      }).addTo(map);
      circleRef.current = circle;

      map.fitBounds(circle.getBounds(), { padding: [40, 40] });
      initialFitDone.current = true;

      mapRef.current = map;
    });

    return () => {
      mounted = false;
      mapRef.current?.remove();
      mapRef.current = null;
      userMarkerRef.current = null;
      circleRef.current = null;
      initialFitDone.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetLat, targetLng]);

  // Update circle color when inRange changes
  useEffect(() => {
    const c = circleRef.current;
    if (!c) return;
    const color = inRange ? '#22c55e' : '#ff6b2b';
    c.setStyle({ color, fillColor: color });
  }, [inRange]);

  // Update circle radius when step changes
  useEffect(() => {
    if (!circleRef.current) return;
    circleRef.current.setRadius(radiusMeters);
    if (mapRef.current && initialFitDone.current) {
      mapRef.current.fitBounds(circleRef.current.getBounds(), { padding: [40, 40], maxZoom: 16 });
    }
  }, [radiusMeters]);

  // Update user marker position
  useEffect(() => {
    if (userLat === null || userLng === null) return;
    import('leaflet').then((mod) => {
      if (!mapRef.current) return;
      const L = mod.default;
      if (!userMarkerRef.current) {
        userMarkerRef.current = L.circleMarker([userLat, userLng], {
          radius: 9,
          color: '#2563eb',
          fillColor: '#3b82f6',
          fillOpacity: 1,
          weight: 3,
        }).addTo(mapRef.current);
      } else {
        userMarkerRef.current.setLatLng([userLat, userLng]);
      }
    });
  }, [userLat, userLng]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
