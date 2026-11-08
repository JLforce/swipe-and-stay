// Server copy of the matching math in src/lib/matching.ts (pagpaguitan branch), adapted to the
// database column values (e.g. type 'boarding_house', roommate_pref 'no_preference').
// Keep the formulas in sync with the app until the app imports this file instead.

export type Factor = "price" | "distance" | "amenities" | "type";
export type Weights = Record<Factor, number>;
export const FACTORS: Factor[] = ["price", "distance", "amenities", "type"];
export const DEFAULT_WEIGHTS: Weights = { price: 0.4, distance: 0.3, amenities: 0.2, type: 0.1 };

export interface ListingRow {
  id: string;
  title: string;
  price: number;
  type: string; // dorm | boarding_house | apartment | condo
  occupancy: string | null; // solo | shared
  lat: number;
  lng: number;
  amenities: string[];
}

export interface PrefsRow {
  budget_min: number | null;
  budget_max: number | null;
  housing_type: string | null; // null = any
  roommate_pref: string | null; // solo | shared | no_preference
  desired_amenities: string[];
  campus: { short_name: string; lat: number; lng: number };
}

const TYPE_LABEL: Record<string, string> = {
  dorm: "dormitory",
  boarding_house: "boarding house",
  apartment: "apartment",
  condo: "condo",
};

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function distanceKm(l: ListingRow, p: PrefsRow): number {
  return haversineKm({ lat: Number(l.lat), lng: Number(l.lng) }, { lat: Number(p.campus.lat), lng: Number(p.campus.lng) });
}

export function factorScores(l: ListingRow, p: PrefsRow): Record<Factor, number> {
  const price = Number(l.price);
  const max = p.budget_max ?? Infinity;
  const priceScore = price <= max ? 1 : Math.max(0, 1 - (price - max) / max);
  const km = distanceKm(l, p);
  const distance = km <= 0.5 ? 1 : Math.max(0, 1 - (km - 0.5) / 7.5);
  const want = p.desired_amenities ?? [];
  const amenities = want.length === 0 ? 0.5 : want.filter((a) => l.amenities.includes(a)).length / want.length;
  const type = !p.housing_type ? 0.7 : l.type === p.housing_type ? 1 : 0.4;
  return { price: priceScore, distance, amenities, type };
}

/** 0–100 match percentage. */
export function matchScore(l: ListingRow, p: PrefsRow, w: Weights): number {
  const s = factorScores(l, p);
  let total = FACTORS.reduce((sum, f) => sum + s[f] * w[f], 0);
  if (p.roommate_pref && p.roommate_pref !== "no_preference" && l.occupancy === p.roommate_pref) {
    total = Math.min(1, total + 0.05); // roommate bonus (roadmap DEC-06)
  }
  return Math.round(total * 100);
}

const PHRASE: Record<Factor, (l: ListingRow, p: PrefsRow) => string> = {
  price: (l, p) => (p.budget_max == null || Number(l.price) <= p.budget_max ? "within your budget" : "a bit above your budget"),
  distance: (l, p) => `${distanceKm(l, p).toFixed(1)} km from ${p.campus.short_name}`,
  amenities: (l, p) =>
    (p.desired_amenities ?? []).some((a) => l.amenities.includes(a)) ? "has amenities you want" : "decently equipped",
  type: (l) => `a ${TYPE_LABEL[l.type] ?? l.type}`,
};

/** Template caption (roadmap DEC-12). No LLM, so it costs zero tokens. */
export function caption(l: ListingRow, p: PrefsRow, w: Weights): string {
  const s = factorScores(l, p);
  const top = [...FACTORS].sort((a, b) => w[b] * s[b] - w[a] * s[a]).slice(0, 2);
  return `Why you're seeing this: ${PHRASE[top[0]](l, p)} and ${PHRASE[top[1]](l, p)}.`;
}

/** Accepts the jsonb from preference_weights, falling back to defaults for bad/missing values. */
export function toWeights(raw: unknown): Weights {
  const out = { ...DEFAULT_WEIGHTS };
  if (raw && typeof raw === "object") {
    for (const f of FACTORS) {
      const v = Number((raw as Record<string, unknown>)[f]);
      if (Number.isFinite(v) && v >= 0) out[f] = v;
    }
  }
  return out;
}
