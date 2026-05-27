'use client';

import { useEffect, useRef, useCallback } from 'react';

interface Props {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
  readOnly?: boolean;
  markerColor?: string;
}

export default function MapPicker({
  onLocationSelect,
  initialLat = 39.9208,
  initialLng = 32.8541,
  readOnly = false,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markerRef = useRef<unknown>(null);

  const placeMarker = useCallback(async (lat: number, lng: number) => {
    const L = (await import('leaflet')).default;
    const map = mapInstanceRef.current as ReturnType<typeof L.map>;
    if (!map) return;

    if (markerRef.current) {
      (markerRef.current as ReturnType<typeof L.marker>).remove();
    }

    const icon = L.divIcon({
      className: '',
      html: `<div style="width:28px;height:28px;background:#f97316;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });

    const m = L.marker([lat, lng], { icon, draggable: !readOnly }).addTo(map);
    if (!readOnly) {
      m.on('dragend', () => {
        const pos = m.getLatLng();
        onLocationSelect(pos.lat, pos.lng);
      });
    }
    markerRef.current = m;
    onLocationSelect(lat, lng);
  }, [readOnly, onLocationSelect]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let map: ReturnType<import('leaflet').Map['addLayer']> | unknown;

    const init = async () => {
      const L = (await import('leaflet')).default;

      // Fix default icon paths
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      map = L.map(mapRef.current!, {
        center: [initialLat, initialLng],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map as ReturnType<typeof L.map>);

      mapInstanceRef.current = map;

      if (readOnly) {
        placeMarker(initialLat, initialLng);
      } else {
        (map as ReturnType<typeof L.map>).on('click', (e: { latlng: { lat: number; lng: number } }) => {
          placeMarker(e.latlng.lat, e.latlng.lng);
        });
      }
    };

    init();

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative w-full h-full">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div ref={mapRef} className="w-full h-full rounded-xl" />
      {!readOnly && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
          <div className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
            Haritaya tıkla → konum seç
          </div>
        </div>
      )}
    </div>
  );
}
