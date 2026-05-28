'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface Props {
  onLocationSelect?: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
  readOnly?: boolean;
  quests?: Array<{ id: string; latitude: number; longitude: number; title: string; category?: { icon: string; color: string } }>;
  liveUsers?: Array<{ user_id: string; latitude: number; longitude: number; username?: string }>;
  zoom?: number;
}

export default function MapPicker({
  onLocationSelect,
  initialLat = 39.0,
  initialLng = 35.0,
  readOnly = false,
  quests = [],
  liveUsers = [],
  zoom = 6,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markerRef = useRef<unknown>(null);
  const questMarkersRef = useRef<unknown[]>([]);
  const userMarkersRef = useRef<unknown[]>([]);
  const [mapReady, setMapReady] = useState(false);

  const placeMarker = useCallback(async (lat: number, lng: number) => {
    const L = (await import('leaflet')).default;
    const map = mapInstanceRef.current as ReturnType<typeof L.map>;
    if (!map) return;
    if (markerRef.current) (markerRef.current as { remove: () => void }).remove();

    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width:20px;height:20px;
        background:linear-gradient(135deg,#ff6b2b,#ff8c5a);
        border:3px solid white;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 4px 16px rgba(255,107,43,0.6);
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 20],
    });

    const m = L.marker([lat, lng], { icon, draggable: !readOnly }).addTo(map);
    if (!readOnly) {
      m.on('dragend', () => {
        const pos = (m as { getLatLng: () => { lat: number; lng: number } }).getLatLng();
        onLocationSelect?.(pos.lat, pos.lng);
      });
    }
    markerRef.current = m;
    onLocationSelect?.(lat, lng);
  }, [readOnly, onLocationSelect]);

  // Harita başlatma (bir kez)
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const init = async () => {
      const L = (await import('leaflet')).default;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      const map = L.map(mapRef.current!, {
        center: [initialLat, initialLng],
        zoom,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      if (readOnly && initialLat !== 39.0) {
        placeMarker(initialLat, initialLng);
      } else if (!readOnly) {
        map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
          placeMarker(e.latlng.lat, e.latlng.lng);
        });
      }

      setMapReady(true);
    };

    init();

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        setMapReady(false);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Quest ve canlı kullanıcı işaretçileri (quests/liveUsers değişince güncelle)
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    const addMarkers = async () => {
      const L = (await import('leaflet')).default;
      const map = mapInstanceRef.current as ReturnType<typeof L.map>;

      // Eski quest markerlarını kaldır
      questMarkersRef.current.forEach((m) => (m as { remove: () => void }).remove());
      questMarkersRef.current = [];

      // Quest pinleri ekle
      quests.forEach((q) => {
        const icon = L.divIcon({
          className: '',
          html: `<div style="
            background:${q.category?.color || '#ff6b2b'};
            color:white;
            border-radius:50%;
            width:36px;height:36px;
            display:flex;align-items:center;justify-content:center;
            font-size:18px;
            border:3px solid rgba(255,255,255,0.4);
            box-shadow:0 4px 16px rgba(0,0,0,0.5);
            cursor:pointer;
          ">${q.category?.icon || '📍'}</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
        const marker = L.marker([q.latitude, q.longitude], { icon })
          .bindPopup(`<b>${q.title}</b>`, { maxWidth: 200 })
          .addTo(map);
        questMarkersRef.current.push(marker);
      });

      // Eski canlı kullanıcı markerlarını kaldır
      userMarkersRef.current.forEach((m) => (m as { remove: () => void }).remove());
      userMarkersRef.current = [];

      // Canlı kullanıcı noktaları
      liveUsers.forEach((u) => {
        const icon = L.divIcon({
          className: '',
          html: `<div style="
            background:#22c55e;
            border-radius:50%;
            width:16px;height:16px;
            border:3px solid white;
            box-shadow:0 0 10px rgba(34,197,94,0.9);
          "></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        const marker = L.marker([u.latitude, u.longitude], { icon })
          .bindPopup(u.username ? `@${u.username}` : 'Oyuncu')
          .addTo(map);
        userMarkersRef.current.push(marker);
      });
    };

    addMarkers();
  }, [mapReady, quests, liveUsers]);

  return (
    <div className="relative w-full h-full">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} className="w-full h-full" />
      {!readOnly && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
          <div className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
            Haritaya tıkla → konum seç
          </div>
        </div>
      )}
    </div>
  );
}
