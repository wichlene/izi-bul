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

  // GPS veya dışarıdan gelen konum değişince marker güncelle + haritayı o noktaya götür
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || readOnly) return;
    if (!initialLat || !initialLng) return;

    const update = async () => {
      const L = (await import('leaflet')).default;
      const map = mapInstanceRef.current as ReturnType<typeof L.map>;
      await placeMarker(initialLat, initialLng);
      map.setView([initialLat, initialLng], Math.max((map as unknown as { getZoom: () => number }).getZoom(), 13));
    };
    update();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, initialLat, initialLng]);

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
          html: `<div style="position:relative;width:42px;height:42px">
            <div style="
              background:linear-gradient(135deg,#22c55e,#16a34a);
              border-radius:50%;
              width:42px;height:42px;
              border:3px solid white;
              box-shadow:0 2px 12px rgba(34,197,94,0.5), 0 0 0 3px rgba(34,197,94,0.25);
              display:flex;align-items:center;justify-content:center;
            ">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="7" r="4" fill="white"/>
                <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" stroke="white" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <div style="
              position:absolute;bottom:0;right:0;
              width:11px;height:11px;border-radius:50%;
              background:#22c55e;border:2px solid white;
              animation:pulse 1.5s infinite;
            "></div>
          </div>`,
          iconSize: [42, 42],
          iconAnchor: [21, 42],
        });
        const popupHtml = u.username
          ? `<div style="font-family:system-ui;text-align:center;padding:4px 0">
              <div style="font-weight:900;font-size:14px;margin-bottom:6px">@${u.username}</div>
              <div style="font-size:11px;color:#22c55e;margin-bottom:8px">● Çevrimiçi</div>
              <a href="/friends?add=${u.user_id}" style="display:inline-block;background:linear-gradient(135deg,#ff6b2b,#ff3d00);color:white;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:bold;text-decoration:none">+ Arkadaş Ekle</a>
            </div>`
          : 'Oyuncu';
        const marker = L.marker([u.latitude, u.longitude], { icon })
          .bindPopup(popupHtml)
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
