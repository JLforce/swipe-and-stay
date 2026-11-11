/**
 * Rules-based adaptive matching (SDD 5.1, 5.2, 5.3). Pure TypeScript with no React Native
 * imports, so it can move unchanged into supabase/functions/_shared/scoring.ts later.
 */
import type { Campus, HousingType } from "../constants/housing";
import type { Listing } from "../data/mockData";
import { peso } from "./format";
import { commuteMinutes, haversineKm } from "./geo";

export type RoommatePref = "solo" | "shared" | "any";

export interface Prefs {
  campus: Campus;
  budgetMin: number;
  budgetMax: number;
  housingType: HousingType | "Any";
  roommate: RoommatePref;
  desiredAmenities: string[];
  /** Course or program, saved to the profile so the admin can see it. Optional. */
  program?: string;
}

export interface Weights {
  price: number;
  distance: number;
  amenities: number;
  type: number;
}
export type Factor = keyof Weights;
export const FACTORS: Factor[] = ["price", "distance", "amenities", "type"];

export const DEFAULT_WEIGHTS: Weights = { price: 0.4, distance: 0.3, amenities: 0.2, type: 0.1 };
const LEARNING_RATE = 0.03;
const MIN_WEIGHT = 0.05;

export function distanceKm(l: Listing, p: Prefs) {
  return haversineKm(l.coords, { lat: p.campus.lat, lng: p.campus.lng });
}

export function factorScores(l: Listing, p: Prefs): Record<Factor, number> {
  // Price: anything at or under budget is fine; over budget decays toward 0.
  const price = l.price <= p.budgetMax ? 1 : Math.max(0, 1 - (l.price - p.budgetMax) / p.budgetMax);
  // Distance: full marks within 0.5 km, falling to 0 at 8 km.
  const km = distanceKm(l, p);
  const distance = km <= 0.5 ? 1 : Math.max(0, 1 - (km - 0.5) / 7.5);
  // Amenities: share of must-haves covered; neutral (0.5) when none are selected.
  const amenities =
    p.desiredAmenities.length === 0
      ? 0.5
      : p.desiredAmenities.filter((a) => l.amenities.includes(a)).length / p.desiredAmenities.length;
  const type = p.housingType === "Any" ? 0.7 : l.type === p.housingType ? 1 : 0.4;
  return { price, distance, amenities, type };
}

/** 0–100 match percentage. */
export function matchScore(l: Listing, p: Prefs, w: Weights): number {
  const s = factorScores(l, p);
  let total = s.price * w.price + s.distance * w.distance + s.amenities * w.amenities + s.type * w.type;
  // Roommate preference bonus (roadmap DEC-06)
  if (p.roommate !== "any" && l.occupancy === p.roommate) total = Math.min(1, total + 0.05);
  return Math.round(total * 100);
}

/** Simplified version of SDD 5.2. Tune LEARNING_RATE during pilot testing. */
export function updateWeights(w: Weights, scores: Record<Factor, number>, direction: "left" | "right"): Weights {
  const next: Weights = { ...w };
  for (const f of FACTORS) {
    // Liked it and it scores well here -> that factor matters. Passed on it and it scores
    // poorly here -> that factor probably mattered too.
    if (direction === "right" && scores[f] >= 0.7) next[f] += LEARNING_RATE;
    if (direction === "left" && scores[f] <= 0.4) next[f] += LEARNING_RATE;
  }
  for (const f of FACTORS) next[f] = Math.max(MIN_WEIGHT, next[f]);
  const total = FACTORS.reduce((s, f) => s + next[f], 0);
  for (const f of FACTORS) next[f] = next[f] / total;
  return next;
}

export interface Ranked {
  listing: Listing;
  score: number;
  km: number;
}

/** SDD 5.3 – active, not-yet-swiped listings sorted by score. */
export function rankListings(
  listings: Listing[],
  excludeIds: string[],
  p: Prefs,
  w: Weights,
  maxKm?: number,
): Ranked[] {
  return listings
    .filter((l) => l.active && !excludeIds.includes(l.id))
    .map((listing) => ({ listing, score: matchScore(listing, p, w), km: distanceKm(listing, p) }))
    .filter((r) => (maxKm ? r.km <= maxKm : true))
    .sort((a, b) => b.score - a.score);
}

const PHRASE: Record<Factor, (l: Listing, p: Prefs) => string> = {
  price: (l, p) => (l.price <= p.budgetMax ? "within your budget" : "a bit above your budget"),
  distance: (l, p) => `${distanceKm(l, p).toFixed(1)} km from ${p.campus.short}`,
  amenities: (l, p) =>
    p.desiredAmenities.some((a) => l.amenities.includes(a)) ? "has amenities you want" : "decently equipped",
  type: (l) => `a ${l.type.toLowerCase()}`,
};

/** Instant template caption (roadmap DEC-12). An LLM caption can replace this later. */
export function caption(l: Listing, p: Prefs, w: Weights): string {
  const s = factorScores(l, p);
  const top = [...FACTORS].sort((a, b) => w[b] * s[b] - w[a] * s[a]).slice(0, 2);
  return `Why you're seeing this: ${PHRASE[top[0]!](l, p)} and ${PHRASE[top[1]!](l, p)}.`;
}

export function explainFactors(l: Listing, p: Prefs, w: Weights) {
  const s = factorScores(l, p);
  const km = distanceKm(l, p);
  const mins = commuteMinutes(km);
  const matched = p.desiredAmenities.filter((a) => l.amenities.includes(a));
  return [
    {
      label: "Budget fit",
      value: Math.round(s.price * 100),
      weight: Math.round(w.price * 100),
      note: `${peso(l.price)} per month vs your ${peso(p.budgetMin)} to ${peso(p.budgetMax)} budget.`,
    },
    {
      label: "Distance to campus",
      value: Math.round(s.distance * 100),
      weight: Math.round(w.distance * 100),
      note: `${km.toFixed(1)} km from ${p.campus.short} (about ${mins.walk} min walk).`,
    },
    {
      label: "Amenities",
      value: Math.round(s.amenities * 100),
      weight: Math.round(w.amenities * 100),
      note:
        p.desiredAmenities.length === 0
          ? "You haven't picked must-have amenities, so this is neutral."
          : `${matched.length} of ${p.desiredAmenities.length} must-haves covered.`,
    },
    {
      label: "Housing type",
      value: Math.round(s.type * 100),
      weight: Math.round(w.type * 100),
      note: p.housingType === "Any" ? `${l.type}. You're open to any type.` : `${l.type} vs your preferred ${p.housingType}.`,
    },
  ];
}
