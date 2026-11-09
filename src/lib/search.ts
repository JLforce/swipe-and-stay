/**
 * Natural-language search (roadmap stretch S-02). Rule-based, works offline, English + Taglish.
 * Pure TypeScript (no React Native imports) so it can move into an Edge Function later, where an
 * LLM could replace parseQuery() while runSearch() stays the same.
 */
import { CAMPUSES, type Campus, type HousingType } from "../constants/housing";
import type { Listing } from "../data/mockData";
import { peso } from "./format";
import { distanceKm, matchScore, type Prefs, type RoommatePref, type Weights } from "./matching";

export interface ParsedQuery {
  budgetMax?: number;
  budgetMin?: number;
  campus?: Campus;
  maxKm?: number;
  commuteLabel?: string;
  housingType?: HousingType;
  roommate?: Exclude<RoommatePref, "any">;
  amenities: string[];
  area?: string;
  cheapestFirst: boolean;
  ignored: string[];
}

export interface FilterChip {
  label: string;
  value: string;
}

const CAMPUS_WORDS: [RegExp, string][] = [
  [/\bcit[\s-]?u\b|\bcit\b/, "citu"],
  [/\bup\s?cebu\b|\bup\s?lahug\b/, "upcebu"],
  [/\busc\s?talamban\b|\btalamban\b/, "usc-tal"],
  [/\busc\s?downtown\b|\busc\b|\bdowntown\b/, "usc-dt"],
  [/\busj-?r\b|\brecoletos\b/, "usjr"],
  [/\bcnu\b|\bcebu normal\b/, "cnu"],
];

// Place names that match a listing's address text (a campus word wins over these).
const AREAS = ["Lahug", "Banilad", "Basak", "Capitol", "Sanciangko", "Bacalso", "Colon", "Mabolo"];

const AMENITY_WORDS: [RegExp, string][] = [
  [/\bwi-?fi\b|\binternet\b/, "Wi-Fi"],
  [/\baircon\b|\bair-?con\b|\bair conditioning\b|\bac\b/, "Aircon"],
  [/\blaundry\b|\blaba\b/, "Laundry"],
  [/\bstudy\b|\bquiet\b|\btahimik\b/, "Study area"],
  [/\bkitchen\b|\bkusina\b/, "Kitchen"],
  [/\bfurnished\b/, "Furnished"],
  [/\bmeals?\b|\bfood\b|\bpagkain\b/, "Meals included"],
  [/\bcctv\b/, "CCTV"],
  [/\bguard(?:ed)?\b|\bsecurity\b|\bsecure\b|\bligtas\b/, "Guarded entrance"],
  [/\bfemale\b|\bgirls?\b|\bladies\b|\bbabae\b/, "Female only"],
  [/\bpets?\b/, "Pet-friendly"],
  [/\bbike\b|\bbicycle\b/, "Bike rack"],
];

const MIN_WORDS = /(over|above|at least|more than|min(?:imum)?|higit)\s*$/;

interface Money {
  value: number;
  start: number;
  end: number;
}

function findMoney(text: string): Money[] {
  const out: Money[] = [];
  const re = /(₱|php\s?)?(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)(k)?(?![a-z0-9])/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const base = parseFloat(m[2]!.replace(/,/g, ""));
    const value = m[3] ? base * 1000 : base;
    // Plain small numbers ("2 bedrooms", "15 min") are not money unless marked with ₱, php or k.
    if (m[1] || m[3] || value >= 1000) out.push({ value, start: m.index, end: m.index + m[0].length });
  }
  return out;
}

export function parseQuery(raw: string): ParsedQuery {
  const text = raw.toLowerCase();
  const parsed: ParsedQuery = { amenities: [], cheapestFirst: false, ignored: [] };

  // Budget
  const money = findMoney(text);
  if (money.length >= 2 && /^\s*(-|–|to|and|hanggang)\s*$/.test(text.slice(money[0]!.end, money[1]!.start))) {
    parsed.budgetMin = Math.min(money[0]!.value, money[1]!.value);
    parsed.budgetMax = Math.max(money[0]!.value, money[1]!.value);
  } else if (money.length >= 1) {
    const m = money[0]!;
    const before = text.slice(Math.max(0, m.start - 18), m.start);
    if (MIN_WORDS.test(before)) parsed.budgetMin = m.value;
    else parsed.budgetMax = m.value; // "under", "up to", or a bare amount all mean "at most"
  }

  // Campus
  for (const [re, id] of CAMPUS_WORDS) {
    if (re.test(text)) {
      parsed.campus = CAMPUSES.find((c) => c.id === id);
      break;
    }
  }

  // Commute: "within 15 min walk" (about 12 min per km on foot, 4 per km by bike)
  const walk = text.match(/(\d+)\s*-?\s*(?:min(?:ute)?s?)\s*(?:walk|lakad)/) ?? text.match(/walk(?:ing)?\s*(?:of|within)?\s*(\d+)\s*min/);
  const bike = text.match(/(\d+)\s*-?\s*(?:min(?:ute)?s?)\s*(?:bike|biking|bicycle)/);
  if (walk) {
    const n = Number(walk[1]);
    parsed.maxKm = n / 12;
    parsed.commuteLabel = `≤ ${n} min walk`;
  } else if (bike) {
    const n = Number(bike[1]);
    parsed.maxKm = n / 4;
    parsed.commuteLabel = `≤ ${n} min by bike`;
  } else if (/\bnear (?:the )?campus\b|\bmalapit sa campus\b|\bmalapit\b|\bwalking distance\b|\bnear school\b/.test(text)) {
    parsed.maxKm = 2;
    parsed.commuteLabel = "≤ 2 km";
  }

  // Housing type
  if (/\bdorm(?:itory|s)?\b/.test(text)) parsed.housingType = "Dormitory";
  else if (/\bboarding\b|\bbed ?space\b/.test(text)) parsed.housingType = "Boarding House";
  else if (/\bapartment\b|\bapt\b/.test(text)) parsed.housingType = "Apartment";
  else if (/\bcondo(?:minium)?\b/.test(text)) parsed.housingType = "Condo";

  // Roommate (check "no roommate" first)
  if (/\bno roommate\b|\bwithout (?:a )?roommate\b|\bwalang roommate\b|\bsolo\b|\balone\b|\bprivate room\b|\bown room\b|\bmag-?isa\b/.test(text)) parsed.roommate = "solo";
  else if (/\broommates?\b|\bshared?\b|\bkasama\b|\bsharing\b/.test(text)) parsed.roommate = "shared";

  // Amenities
  for (const [re, name] of AMENITY_WORDS) if (re.test(text) && !parsed.amenities.includes(name)) parsed.amenities.push(name);

  // Place name that appears in an address (only if no campus word was used for it)
  if (!parsed.campus) {
    const area = AREAS.find((a) => text.includes(a.toLowerCase()));
    if (area) parsed.area = area;
  } else {
    const area = AREAS.find((a) => text.includes(a.toLowerCase()));
    if (area && area !== "Colon") parsed.area = area;
  }

  if (/\bcheap(?:est)?\b|\bmura\b|\bpinakamura\b|\baffordable\b|\bbudget\b/.test(text)) parsed.cheapestFirst = true;

  // Things the data doesn't track yet
  const bedrooms = text.match(/(\d+)\s*(?:bedrooms?|br|kwarto)/);
  if (bedrooms) parsed.ignored.push(`${bedrooms[1]} bedrooms`);

  return parsed;
}

export function describeFilters(p: ParsedQuery, baseCampus: Campus): FilterChip[] {
  const chips: FilterChip[] = [];
  if (p.budgetMin && p.budgetMax) chips.push({ label: "Budget", value: `${peso(p.budgetMin)} – ${peso(p.budgetMax)} / mo` });
  else if (p.budgetMax) chips.push({ label: "Budget", value: `≤ ${peso(p.budgetMax)} / mo` });
  else if (p.budgetMin) chips.push({ label: "Budget", value: `≥ ${peso(p.budgetMin)} / mo` });
  if (p.campus) chips.push({ label: "Campus", value: p.campus.short });
  if (p.commuteLabel) chips.push({ label: "Commute", value: `${p.commuteLabel} of ${(p.campus ?? baseCampus).short}` });
  if (p.housingType) chips.push({ label: "Type", value: p.housingType });
  if (p.roommate) chips.push({ label: "Roommate", value: p.roommate === "shared" ? "Shared" : "Solo" });
  if (p.amenities.length) chips.push({ label: "Amenities", value: p.amenities.join(", ") });
  if (p.area) chips.push({ label: "Area", value: p.area });
  if (p.cheapestFirst) chips.push({ label: "Sort", value: "Cheapest first" });
  return chips;
}

export interface SearchHit {
  listing: Listing;
  score: number;
  km: number;
}

export interface SearchOutcome {
  chips: FilterChip[];
  ignored: string[];
  hits: SearchHit[];
  exact: boolean;
  message: string;
}

export function runSearch(query: string, listings: Listing[], prefs: Prefs, weights: Weights): SearchOutcome {
  const parsed = parseQuery(query);
  const campus = parsed.campus ?? prefs.campus;
  const eff: Prefs = {
    ...prefs,
    campus,
    budgetMin: parsed.budgetMin ?? prefs.budgetMin,
    budgetMax: parsed.budgetMax ?? prefs.budgetMax,
    housingType: parsed.housingType ?? prefs.housingType,
    roommate: parsed.roommate ?? prefs.roommate,
    desiredAmenities: parsed.amenities.length ? parsed.amenities : prefs.desiredAmenities,
  };
  const chips = describeFilters(parsed, prefs.campus);

  const base = listings
    .filter((l) => l.active)
    .map((listing) => ({ listing, score: matchScore(listing, eff, weights), km: distanceKm(listing, eff) }));

  const budgetOk = (h: SearchHit) =>
    (parsed.budgetMax === undefined || h.listing.price <= parsed.budgetMax) &&
    (parsed.budgetMin === undefined || h.listing.price >= parsed.budgetMin);
  const typeOk = (h: SearchHit) => !parsed.housingType || h.listing.type === parsed.housingType;
  const areaOk = (h: SearchHit) => !parsed.area || h.listing.area.toLowerCase().includes(parsed.area.toLowerCase());
  const kmOk = (h: SearchHit) => parsed.maxKm === undefined || h.km <= parsed.maxKm;
  const roommateOk = (h: SearchHit) => !parsed.roommate || h.listing.occupancy === parsed.roommate;
  const amenitiesOk = (h: SearchHit) => parsed.amenities.every((a) => h.listing.amenities.includes(a));

  const order = (hits: SearchHit[]) =>
    [...hits].sort((a, b) => (parsed.cheapestFirst ? a.listing.price - b.listing.price : b.score - a.score));

  let hits = base.filter((h) => budgetOk(h) && typeOk(h) && areaOk(h) && kmOk(h) && roommateOk(h) && amenitiesOk(h));
  let exact = true;
  if (hits.length === 0 && chips.length > 0) {
    exact = false;
    hits = base.filter((h) => budgetOk(h) && typeOk(h) && areaOk(h) && kmOk(h));
    if (hits.length === 0) hits = base.filter((h) => budgetOk(h));
    if (hits.length === 0) hits = base;
  }
  if (chips.length === 0) hits = base;
  hits = order(hits).slice(0, 8);

  let message: string;
  if (chips.length === 0) {
    message = "I couldn't pick out any filters, so here are the best matches for your saved preferences. Try mentioning a budget, a campus, or a housing type.";
  } else if (!exact) {
    message = `No place matches every filter, so these are the closest ${hits.length} option${hits.length === 1 ? "" : "s"}.`;
  } else {
    message = `Got it. I read ${chips.length} filter${chips.length === 1 ? "" : "s"} and found ${hits.length} match${hits.length === 1 ? "" : "es"}.`;
  }
  return { chips, ignored: parsed.ignored, hits, exact, message };
}

export const SEARCH_SAMPLE_PROMPT = "Find me a place near campus under ₱10,000 with a roommate.";
export const SEARCH_SUGGESTIONS = [
  "Female-only dorm with meals under ₱6,000",
  "Bike-friendly apartment, 2 bedrooms, Basak",
  "Quiet place with a study area near Talamban",
  "Murang boarding house malapit sa CIT-U na may wifi",
];
