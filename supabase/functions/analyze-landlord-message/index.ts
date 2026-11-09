// POST { message: string } -> { risk, flagged[], explanation, safety_tips[], source }
// Scam check for a pasted landlord message (SRS 3.1.8).
//
// Always runs free rule checks first. If CEREBRAS_API_KEY is set it also asks the AI, and the
// final risk is never lower than the rules say. If the AI is missing, busy or returns junk, the
// rule result is returned (SRS 3.3.2). Token saving: signed-in only, length caps, short prompt,
// capped reply, best-effort per-user hourly limit.
import { corsHeaders, fail, json, userClient } from "../_shared/http.ts";
import { coerceAi, maxRisk, ruleAnalysis, SAFETY_TIPS, type Analysis } from "../_shared/scam.ts";

const MIN_CHARS = 15;
const MAX_CHARS = Number(Deno.env.get("SCAM_MAX_CHARS") ?? 3000);
const HOURLY_LIMIT = Number(Deno.env.get("SCAM_HOURLY_LIMIT") ?? 10);
const MODEL = Deno.env.get("CEREBRAS_MODEL") ?? "qwen-3.8-27b";
const REASONING = Deno.env.get("CEREBRAS_REASONING") ?? "none";
const CEREBRAS_URL = "https://api.cerebras.ai/v1/chat/completions";

const SYSTEM_PROMPT = `You check messages from Philippine landlords for scam signs: advance payment requests, deposit or reservation before viewing, and urgency pressure. The message may be English, Tagalog, Cebuano (Bisaya) or any mix of them.
Reply with ONLY JSON: {"risk":"Low|Medium|High","flagged":[{"phrase":"exact quote from the message, max 80 chars","reason":"max 20 words"}],"explanation":"max 2 plain sentences"}
Max 5 flagged. Quote only text that appears in the message. If there are no scam signs, risk is Low and flagged is [].`;

// Best-effort limiter. Memory is per function instance, so this only slows abuse; there is no
// database table for scam checks yet.
const usage = new Map<string, number[]>();
function overLimit(userId: string): boolean {
  const now = Date.now();
  const recent = (usage.get(userId) ?? []).filter((t) => now - t < 3_600_000);
  if (recent.length >= HOURLY_LIMIT) {
    usage.set(userId, recent);
    return true;
  }
  recent.push(now);
  usage.set(userId, recent);
  return false;
}

function normalize(text: string): string {
  return text.replace(/\r\n?/g, "\n").replace(/[ \t\f\v]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function parseJson(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const m = content.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("no JSON");
    return JSON.parse(m[0]);
  }
}

async function askCerebras(apiKey: string, message: string): Promise<Analysis | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20_000);
  try {
    const res = await fetch(CEREBRAS_URL, {
      method: "POST",
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        max_tokens: 350,
        reasoning_effort: REASONING,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message },
        ],
      }),
    });
    if (!res.ok) {
      console.error(`scam-check Cerebras ${res.status}`);
      return null;
    }
    const data = await res.json();
    if (data?.usage) console.log(`scam-check tokens: in=${data.usage.prompt_tokens} out=${data.usage.completion_tokens}`);
    return coerceAi(parseJson(data?.choices?.[0]?.message?.content ?? ""), message);
  } catch (e) {
    console.error("scam-check AI failed:", (e as Error).message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return fail("Use POST.", 405);

  const session = await userClient(req);
  if (!session) return fail("Please sign in first.", 401, "unauthorized");

  let body: { message?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request body.");
  }
  const message = typeof body.message === "string" ? normalize(body.message) : "";
  if (message.length < MIN_CHARS) return fail("Please paste the landlord's message.", 400, "too_short");
  if (message.length > MAX_CHARS) {
    return fail(`Message is too long. Paste up to ${MAX_CHARS.toLocaleString()} characters.`, 400, "too_long");
  }
  if (overLimit(session.userId)) {
    return fail("You've checked a lot of messages. Try again in a bit.", 429, "rate_limited");
  }

  const rules = ruleAnalysis(message);
  const apiKey = Deno.env.get("CEREBRAS_API_KEY");
  const ai = apiKey ? await askCerebras(apiKey, message) : null;

  const result: Analysis = ai
    ? {
        risk: maxRisk(ai.risk, rules.risk), // never softer than the free rules
        flagged: ai.flagged.length ? ai.flagged : rules.flagged,
        explanation: ai.explanation,
      }
    : rules;

  return json({ ...result, safety_tips: SAFETY_TIPS, source: ai ? "ai" : "rules" });
});
