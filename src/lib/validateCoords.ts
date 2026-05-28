// Türkiye sınır koordinatları (biraz toleranslı)
const TURKEY_BOUNDS = {
  latMin: 35.5,
  latMax: 42.5,
  lngMin: 25.5,
  lngMax: 45.0,
};

export function isInTurkey(lat: number, lng: number): boolean {
  return (
    lat >= TURKEY_BOUNDS.latMin &&
    lat <= TURKEY_BOUNDS.latMax &&
    lng >= TURKEY_BOUNDS.lngMin &&
    lng <= TURKEY_BOUNDS.lngMax
  );
}

export function isValidCoord(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    isFinite(lat) &&
    isFinite(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
}
