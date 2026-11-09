// POST { listing_id: string } -> { explanation, score, cached }
// Powers "Why am I seeing this?" (SRS 3.1.5). The template caption is always built first. If
// CEREBRAS_API_KEY is set, the AI rewrites it as a friendlier explanation using only those facts;
// if the AI is missing, slow or returns junk, the template is used (SRS 3.3.2).
// Result is saved once per (user, listing) in public.match_explanations, so the AI runs once.
import { adminClient, corsHeaders, fail, json, userClient } from "../_shared/http.ts";
import { caption, matchScore, toWeights, type ListingRow, type PrefsRow } from "../_shared/scoring.ts";

const MODEL = Deno.env.get("CEREBRAS_MODEL") ?? "qwen-3.8-27b";
const REASONING = Deno.env.get("CEREBRAS_REASONING") ?? "none";
const CEREBRAS_URL = "https://api.cerebras.ai/v1/chat/completions";

const SYSTEM_PROMPT =
  "You explain to a Filipino student why a housing listing matches them. Use ONLY the facts given. Do not add numbers, places or amenities that are not in the facts. Write 1-2 short, friendly sentences, max 45 words, plain text.";

async function askCerebras(apiKey: string, facts: string): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(CEREBRAS_URL, {
      method: "POST",
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        max_tokens: 120,
        reasoning_effort: REASONING,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: facts },
        ],
      }),
    });
    if (!res.ok) {
      console.error(`explain-match Cerebras ${res.status}`);
      return null;
    }
    const data = await res.json();
    if (data?.usage) console.log(`explain-match tokens: in=${data.usage.prompt_tokens} out=${data.usage.completion_tokens}`);
    const text = String(data?.choices?.[0]?.message?.content ?? "").replace(/\s+/g, " ").trim();
    // Reject empty or runaway output; the template is used instead.
    return text.length >= 20 && text.length <= 400 ? text : null;
  } catch (e) {
    console.error("explain-match AI failed:", (e as Error).message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

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

  const template = caption(listing, prefs, weights);
  const apiKey = Deno.env.get("CEREBRAS_API_KEY");
  const facts = `Listing: ${listing.title}, PHP ${listing.price}/month. Match score: ${score}%. Why it matches: ${template}`;
  const explanation = (apiKey ? await askCerebras(apiKey, facts) : null) ?? template;
  // Users can only SELECT match_explanations (RLS), so the server writes it.
  const { error } = await adminClient()
    .from("match_explanations")
    .upsert({ user_id: userId, listing_id: listingId, explanation }, { onConflict: "user_id,listing_id" });
  if (error) console.error("explain-match save failed:", error.message);

  return json({ explanation, score, cached: false });
});
