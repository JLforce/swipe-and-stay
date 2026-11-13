// Saves and loads a student's onboarding choices in public.profiles, so the admin can see them
// and the match explanation (which needs the student's campus) works.
import { CAMPUSES, type HousingType } from "../constants/housing";
import { FACTORS, type Prefs, type RoommatePref, type Weights } from "./matching";
import { supabase } from "./supabase";

// App campus id -> campuses.short_name in the database.
const CAMPUS_SHORT: Record<string, string> = {
  citu: "CIT-U",
  upcebu: "UP-CEBU",
  "usc-dt": "USC-DT",
  "usc-tal": "USC-TAL",
  usjr: "USJ-R",
  cnu: "CNU",
};

const HOUSING_TO_DB: Record<HousingType, string> = {
  Dormitory: "dorm",
  "Boarding House": "boarding_house",
  Apartment: "apartment",
  Condo: "condo",
};
const HOUSING_FROM_DB: Record<string, HousingType> = {
  dorm: "Dormitory",
  boarding_house: "Boarding House",
  apartment: "Apartment",
  condo: "Condo",
};
const ROOMMATE_TO_DB: Record<RoommatePref, string> = { solo: "solo", shared: "shared", any: "no_preference" };
const ROOMMATE_FROM_DB: Record<string, RoommatePref> = { solo: "solo", shared: "shared", no_preference: "any" };

/** Saves the preferences and marks onboarding as finished. Throws if the update fails. */
export async function saveProfilePrefs(userId: string, p: Prefs): Promise<void> {
  const short = CAMPUS_SHORT[p.campus.id];
  const { data: campus } = short
    ? await supabase.from("campuses").select("id").eq("short_name", short).maybeSingle()
    : { data: null };
  if (!campus) console.warn("Campus not found in the database; saving the other preferences only.");

  const { error } = await supabase
    .from("profiles")
    .update({
      ...(campus ? { campus_id: campus.id } : {}),
      program: p.program?.trim() ? p.program.trim().slice(0, 80) : null,
      budget_min: Math.round(p.budgetMin),
      budget_max: Math.round(p.budgetMax),
      housing_type: p.housingType === "Any" ? null : HOUSING_TO_DB[p.housingType],
      roommate_pref: ROOMMATE_TO_DB[p.roommate],
      desired_amenities: p.desiredAmenities,
      onboarding_completed: true,
    })
    .eq("id", userId);
  if (error) throw error;
}

/** Reads saved preferences. `hasCampus` is false when the student never saved a campus. */
export async function loadProfilePrefs(userId: string, base: Prefs): Promise<{ prefs: Prefs; hasCampus: boolean }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("program, budget_min, budget_max, housing_type, roommate_pref, desired_amenities, campus:campuses(short_name)")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return { prefs: base, hasCampus: false };

  const rel = data.campus as { short_name: string } | { short_name: string }[] | null;
  const short = Array.isArray(rel) ? rel[0]?.short_name : rel?.short_name;
  const campus = CAMPUSES.find((c) => CAMPUS_SHORT[c.id] === short);

  return {
    hasCampus: !!campus,
    prefs: {
      campus: campus ?? base.campus,
      budgetMin: data.budget_min ?? base.budgetMin,
      budgetMax: data.budget_max ?? base.budgetMax,
      housingType: (data.housing_type && HOUSING_FROM_DB[data.housing_type]) || "Any",
      roommate: (data.roommate_pref && ROOMMATE_FROM_DB[data.roommate_pref]) || base.roommate,
      desiredAmenities: data.desired_amenities ?? [],
      program: data.program ?? "",
    },
  };
}

/** The student's learned matching weights, or null if none are saved yet. */
export async function loadWeights(userId: string): Promise<Weights | null> {
  const { data, error } = await supabase
    .from("preference_weights")
    .select("priority_weights")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  const w = data?.priority_weights as Partial<Record<keyof Weights, number>> | undefined;
  if (!w || !FACTORS.every((f) => typeof w[f] === "number")) return null;
  return { price: w.price!, distance: w.distance!, amenities: w.amenities!, type: w.type! };
}

/** Best-effort save, so the database (and new-match notifications) use the same weights as the app. */
export async function saveWeights(userId: string, weights: Weights, swipeCount: number): Promise<void> {
  const { error } = await supabase.from("preference_weights").upsert({
    user_id: userId,
    priority_weights: { ...weights },
    swipe_count: swipeCount,
    updated_at: new Date().toISOString(),
  });
  if (error) console.warn("Could not save matching weights", error.message);
}
