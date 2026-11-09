export interface Coord {
  lat: number;
  lng: number;
}

const toRad = (d: number) => (d * Math.PI) / 180;

/** SDD 5.4 – great-circle distance in kilometers. */
export function haversineKm(a: Coord, b: Coord): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function commuteMinutes(km: number) {
  return {
    walk: Math.max(1, Math.round(km * 12)),
    bike: Math.max(1, Math.round(km * 4)),
    transit: Math.round(km * 2.5) + 6,
  };
}
