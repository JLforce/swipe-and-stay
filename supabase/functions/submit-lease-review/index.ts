// POST { text: string } -> LeaseResult
// Summarises a pasted lease with Cerebras and stores it in public.lease_reviews.
//
// Token-saving rules (the reason most of this file exists):
//  1. Only signed-in users.                 4. Max N new reviews per user per day.
//  2. Reject too-short / too-long text      5. Whitespace collapsed before sending.
//     before any LLM call.                  6. Tiny prompt, JSON-only reply, capped max_tokens.
//  3. Same text already reviewed by this    7. No CEREBRAS_API_KEY -> sample result, zero calls.
//     user -> return saved row, no call.
import { fail, json, corsHeaders, userClient } from "../_shared/http.ts";

const MIN_CHARS = 40;
const MAX_CHARS = Number(Deno.env.get("LEASE_MAX_CHARS") ?? 12000);
const DAILY_LIMIT = Number(Deno.env.get("LEASE_DAILY_LIMIT") ?? 5);
const MODEL = Deno.env.get("CEREBRAS_MODEL") ?? "qwen-3.8-27b";
const MAX_OUTPUT_TOKENS = 600;
// "none" turns off hidden thinking (it would burn the token cap). Use "low" for gpt-oss models.
const REASONING = Deno.env.get("CEREBRAS_REASONING") ?? "none";
const CEREBRAS_URL = "https://api.cerebras.ai/v1/chat/completions";

interface LeaseResult {
  summary: string;
  deposit: string;
  notice_period: string;
  utilities_included: string;
  penalties: string;
  flagged_clauses: { clause: string; reason: string }[];
}

// Same as SAMPLE_LEASE_RESULT in src/data/mockData.ts, used when no API key is configured.
const SAMPLE: LeaseResult = {
  summary:
    "A 6-month room lease at ₱7,500 per month. You pay ₱22,500 on signing, utilities are extra, and leaving early costs you the deposit.",
  deposit: "₱22,500 on signing: 2 months' deposit (₱15,000, refundable) + 1 month advance (₱7,500).",
  notice_period: "Not clearly stated. Ask the landlord how much notice is needed before moving out.",
  utilities_included: "No. Electricity and water are billed separately (sub-meter rates).",
  penalties: "Leaving before 6 months forfeits the full deposit.",
  flagged_clauses: [
    { clause: "Early termination", reason: "You lose the entire ₱15,000 deposit if you leave before 6 months." },
    { clause: "Overnight guests", reason: "No overnight visitors unless the landlord approves in writing first." },
  ],
};

// Kept short on purpose: every word here is paid for on every request.
const SYSTEM_PROMPT = `You review Philippine rental leases for university students.
Reply with ONLY a JSON object with these keys:
summary (max 2 sentences, plain English),
deposit, notice_period, utilities_included, penalties (each a short text string, never true/false; write "Not stated" if absent),
flagged_clauses (array, max 5, of {clause, reason}: terms that are unusual, unfair or risky for the tenant).
Use ₱ for amounts. Do not invent terms that are not in the lease.`;

/** Collapses spacing so we don't pay for whitespace. Also the cache key. */
function normalize(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

const str = (v: unknown, max: number, fallback = "Not stated") => {
  if (typeof v === "boolean") return v ? "Yes" : "No"; // models sometimes answer true/false
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : fallback;
};

/** Never trust model output shape; coerce into LeaseResult. */
function coerce(raw: unknown): LeaseResult {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const clauses = Array.isArray(o.flagged_clauses) ? o.flagged_clauses : [];
  return {
    summary: str(o.summary, 400, "Summary unavailable."),
    deposit: str(o.deposit, 250),
    notice_period: str(o.notice_period, 250),
    utilities_included: str(o.utilities_included, 250),
    penalties: str(o.penalties, 250),
    flagged_clauses: clauses
      .slice(0, 5)
      .map((c) => (c && typeof c === "object" ? (c as Record<string, unknown>) : {}))
      .map((c) => ({ clause: str(c.clause, 80, ""), reason: str(c.reason, 250, "") }))
      .filter((c) => c.clause && c.reason),
  };
}

function parseJson(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const m = content.match(/\{[\s\S]*\}/); // model wrapped JSON in prose/code fences
    if (!m) throw new Error("Model did not return JSON");
    return JSON.parse(m[0]);
  }
}

async function askCerebras(apiKey: string, lease: string): Promise<LeaseResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30_000);
  try {
    const res = await fetch(CEREBRAS_URL, {
      method: "POST",
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        max_tokens: MAX_OUTPUT_TOKENS,
        reasoning_effort: REASONING,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: lease },
        ],
      }),
    });
    if (res.status === 429) throw Object.assign(new Error("rate_limited"), { status: 429 });
    if (!res.ok) throw new Error(`Cerebras ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    const usage = data?.usage;
    if (usage) console.log(`lease-review tokens: in=${usage.prompt_tokens} out=${usage.completion_tokens}`);
    return coerce(parseJson(data?.choices?.[0]?.message?.content ?? ""));
  } finally {
    clearTimeout(timer);
  }
}

function fromRow(r: Record<string, unknown>): LeaseResult {
  return coerce({ ...r, summary: r.summary_text });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return fail("Use POST.", 405);

  const session = await userClient(req);
  if (!session) return fail("Please sign in first.", 401, "unauthorized");
  const { db, userId } = session;

  let body: { text?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request body.");
  }
  const text = typeof body.text === "string" ? normalize(body.text) : "";
  if (text.length < MIN_CHARS) return fail("Please paste more of the lease text.", 400, "too_short");
  if (text.length > MAX_CHARS) {
    return fail(`Lease is too long. Paste up to ${MAX_CHARS.toLocaleString()} characters.`, 400, "too_long");
  }

  // 3. Cache: same user, same text -> reuse, no tokens spent.
  const cached = await db
    .from("lease_reviews")
    .select("summary_text, deposit, notice_period, utilities_included, penalties, flagged_clauses")
    .eq("user_id", userId)
    .eq("lease_text", text)
    .not("completed_at", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (cached.data) return json({ ...fromRow(cached.data), cached: true });

  const apiKey = Deno.env.get("CEREBRAS_API_KEY");
  if (!apiKey) return json({ ...SAMPLE, sample: true }); // dev mode: no key, no call, nothing saved

  // 4. Daily limit (only real, new reviews count).
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countErr } = await db
    .from("lease_reviews")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  if (countErr) return fail("Could not check your usage. Try again.", 500);
  if ((count ?? 0) >= DAILY_LIMIT) {
    return fail(`You've reached ${DAILY_LIMIT} lease reviews today. Try again tomorrow.`, 429, "daily_limit");
  }

  let result: LeaseResult;
  try {
    result = await askCerebras(apiKey, text);
  } catch (e) {
    if ((e as { status?: number }).status === 429) {
      return fail("The lease assistant is busy right now. Try again in a minute.", 503, "provider_busy");
    }
    console.error("lease-review failed:", e);
    return fail("Could not analyze this lease. Please try again.", 502, "provider_error");
  }

  // Single insert (lease_reviews has no UPDATE policy), as the user so RLS applies.
  const { error: insertErr } = await db.from("lease_reviews").insert({
    user_id: userId,
    lease_text: text,
    summary_text: result.summary,
    deposit: result.deposit,
    notice_period: result.notice_period,
    utilities_included: result.utilities_included,
    penalties: result.penalties,
    flagged_clauses: result.flagged_clauses,
    completed_at: new Date().toISOString(),
  });
  if (insertErr) console.error("lease-review save failed:", insertErr.message); // still return the result

  return json(result);
});
