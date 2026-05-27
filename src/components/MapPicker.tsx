'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Props {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
  readOnly?: boolean;
  markerColor?: string;
}

export default function MapPicker({
  onLocationSelect,
  initialLat = 41.015,
  initialLng = 28.979,
  readOnly = false,
  markerColor = '#f97316',
}: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [hasPin, setHasPin] = useState(false);

  const placeMarker = useCallback((lng: number, lat: number) => {
    if (!map.current) return;
    if (marker.current) marker.current.remove();
    marker.current = new mapboxgl.Marker({ color: markerColor, draggable: !readOnly })
      .setLngLat([lng, lat])
      .addTo(map.current);

    if (!readOnly) {
      marker.current.on('dragend', () => {
        const pos = marker.current!.getLngLat();
        onLocationSelect(pos.lat, pos.lng);
      });
    }

    setHasPin(true);
    onLocationSelect(lat, lng);
  }, [markerColor, readOnly, onLocationSelect]);

  useEffect(() => {
    if (!mapContainer.current) return;
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [initialLng, initialLat],
      zoom: 13,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    if (!readOnly) {
      map.current.on('click', (e) => {
        placeMarker(e.lngLat.lng, e.lngLat.lat);
      });
    } else {
      placeMarker(initialLng, initialLat);
    }

    return () => {
      map.current?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
      {!readOnly && !hasPin && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/60 text-white text-sm px-4 py-2 rounded-full backdrop-blur-sm">
            Haritaya tıkla → pin bırak
          </div>
        </div>
      )}
    </div>
  );
}
