// POST { listing_id: string } -> { explanation, score, cached }
// Powers "Why am I seeing this?". Uses the template caption (roadmap DEC-12): zero LLM tokens.
// Result is saved once per (user, listing) in public.match_explanations and reused after.
import { adminClient, corsHeaders, fail, json, userClient } from "../_shared/http.ts";
import { caption, matchScore, toWeights, type ListingRow, type PrefsRow } from "../_shared/scoring.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return fail("Use POST.", 405);

  const session = await userClient(req);
  if (!session) return fail("Please sign in first.", 401, "unauthorized");
  const { db, userId } = session;

  let body: { listing_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request body.");
  }
  const listingId = typeof body.listing_id === "string" ? body.listing_id : "";
  if (!UUID.test(listingId)) return fail("listing_id must be a UUID.");

  // Reads run as the user, so RLS decides what they may see.
  const [listingRes, profileRes, weightsRes, cachedRes] = await Promise.all([
    db.from("listings").select("id, title, price, type, occupancy, lat, lng, amenities").eq("id", listingId).maybeSingle(),
    db
      .from("profiles")
      .select("budget_min, budget_max, housing_type, roommate_pref, desired_amenities, campus:campuses(short_name, lat, lng)")
      .eq("id", userId)
      .maybeSingle(),
    db.from("preference_weights").select("priority_weights").eq("user_id", userId).maybeSingle(),
    db.from("match_explanations").select("explanation").eq("user_id", userId).eq("listing_id", listingId).maybeSingle(),
  ]);

  const listing = listingRes.data as ListingRow | null;
  if (!listing) return fail("Listing not found.", 404, "not_found");
  const profile = profileRes.data as (Omit<PrefsRow, "campus"> & { campus: PrefsRow["campus"] | null }) | null;
  if (!profile?.campus) return fail("Finish setting up your preferences first.", 400, "no_preferences");

  const prefs = profile as PrefsRow;
  const weights = toWeights(weightsRes.data?.priority_weights);
  const score = matchScore(listing, prefs, weights);

  if (cachedRes.data) return json({ explanation: cachedRes.data.explanation, score, cached: true });

  const explanation = caption(listing, prefs, weights);
  // Users can only SELECT match_explanations (RLS), so the server writes it.
  const { error } = await adminClient()
    .from("match_explanations")
    .upsert({ user_id: userId, listing_id: listingId, explanation }, { onConflict: "user_id,listing_id" });
  if (error) console.error("explain-match save failed:", error.message);

  return json({ explanation, score, cached: false });
});
