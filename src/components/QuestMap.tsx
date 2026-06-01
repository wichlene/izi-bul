'use client';

import { useEffect, useRef } from 'react';

interface Props {
  userLat: number | null;
  userLng: number | null;
  targetLat: number;
  targetLng: number;
  radiusMeters: number;
  inRange?: boolean;
  visible?: boolean;
}

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';

export default function QuestMap({ userLat, userLng, targetLat, targetLng, radiusMeters, inRange, visible }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const userMarkerRef = useRef<import('leaflet').CircleMarker | null>(null);
  const circleRef = useRef<import('leaflet').Circle | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let mounted = true;

    import('leaflet').then((mod) => {
      if (!mounted || !containerRef.current || mapRef.current) return;
      const L = mod.default;

      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer(TILE_URL, {
        maxZoom: 19,
        subdomains: 'abcd',
        crossOrigin: true,
      }).addTo(map);

      const circle = L.circle([targetLat, targetLng], {
        radius: radiusMeters,
        color: inRange ? '#22c55e' : '#ff6b2b',
        fillColor: inRange ? '#22c55e' : '#ff6b2b',
        fillOpacity: 0.15,
        weight: 3,
        dashArray: '6 4',
      }).addTo(map);
      circleRef.current = circle;

      // Çemberin sınırlarına fit et
      map.fitBounds(circle.getBounds(), { padding: [48, 48], maxZoom: 17 });
      mapRef.current = map;

      // Container boyutu settle olduktan sonra yenile
      setTimeout(() => { if (mapRef.current) mapRef.current.invalidateSize(); }, 250);
    });

    return () => {
      mounted = false;
      mapRef.current?.remove();
      mapRef.current = null;
      userMarkerRef.current = null;
      circleRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetLat, targetLng]);

  // Çember rengi güncelle
  useEffect(() => {
    const c = circleRef.current;
    if (!c) return;
    const color = inRange ? '#22c55e' : '#ff6b2b';
    c.setStyle({ color, fillColor: color });
  }, [inRange]);

  // Görünür olunca boyutu yenile (height:0'dan açılınca Leaflet boyutu kaçırır)
  useEffect(() => {
    if (visible && mapRef.current) {
      setTimeout(() => mapRef.current?.invalidateSize(), 50);
    }
  }, [visible]);

  // Yarıçap güncelle
  useEffect(() => {
    if (!circleRef.current || !mapRef.current) return;
    circleRef.current.setRadius(radiusMeters);
    mapRef.current.fitBounds(circleRef.current.getBounds(), { padding: [48, 48], maxZoom: 17 });
  }, [radiusMeters]);

  // Kullanıcı konumu güncelle
  useEffect(() => {
    if (userLat === null || userLng === null) return;
    import('leaflet').then((mod) => {
      if (!mapRef.current) return;
      const L = mod.default;
      if (!userMarkerRef.current) {
        userMarkerRef.current = L.circleMarker([userLat, userLng], {
          radius: 10,
          color: '#1d4ed8',
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
      style={{ width: '100%', height: '100%', background: '#e8ecef' }}
    />
  );
}
