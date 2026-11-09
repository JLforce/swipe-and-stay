// Rule-based scam screening for landlord messages (SRS 3.1.8). English, Tagalog/Taglish and Cebuano (Bisaya), including mixed Bislish/Bislog messages.
// Costs no tokens and is the fallback whenever the AI is unavailable (SRS 3.3.2).

export type Risk = "Low" | "Medium" | "High";
export interface Flag {
  phrase: string;
  reason: string;
}
export interface Analysis {
  risk: Risk;
  flagged: Flag[];
  explanation: string;
}

// Always shown to the student, whatever the result (SRS 3.1.8).
export const SAFETY_TIPS = [
  "Never pay anything before viewing the place in person.",
  "Meet the landlord or caretaker at the property, ideally with a friend.",
  "Ask for a written receipt and a signed contract before paying.",
  "Be careful when asked to send money to a personal GCash or bank account.",
  "Take your time. Real landlords don't need an answer in minutes.",
];

type Category = "advance_payment" | "deposit_before_viewing" | "urgency";

const RULES: { category: Category; reason: string; patterns: RegExp[] }[] = [
  {
    category: "advance_payment",
    reason: "Asks for money up front. Scammers often ask for advance or reservation fees.",
    patterns: [
      /advance (payment|rent)/i,
      /reservation fee/i,
      /down ?payment/i,
      /pay (first|now|upfront|in advance)/i,
      /send (the )?(payment|money|deposit)/i,
      /\b(gcash|maya|paymaya|bank transfer)\b/i,
      /(mag)?padala (ng )?(bayad|pera|deposit)/i,
      /bayad (muna|agad|ngayon)/i,
      /\b(bayad|kwarta|deposito?) (una|daan)\b/i,
      /(magbayad|bayaran|mag-?advance|magpadala|ipadala).{0,20}\b(muna|una|agad)\b/i,
      /(ibigay|i-?abot|ihulog)\b.{0,15}(deposit|bayad|pera)/i,
      /bayad sa una/i,
      /(ipadala|padala|i-?send|dad-?a)\w*.{0,15}(bayad|kwarta|deposito?)/i,
    ],
  },
  {
    category: "deposit_before_viewing",
    reason: "Wants a deposit or reservation before you have seen the place.",
    patterns: [
      /(deposit|reserve|reservation|hold (the )?(room|unit|slot)).{0,60}(before|without) (viewing|seeing|visit)/i,
      /(before|without) (viewing|seeing|visiting).{0,60}(deposit|pay|reserve)/i,
      /(deposit|reserv\w*|pay|fee|gcash).{0,40}(then|para|before|bago|antes).{0,30}(view|see|visit|tingnan|bisita|tan-?aw)/i,
      /(pa-?deposit|deposit muna|bayad muna|reserve muna).{0,30}bago/i,
      /(pay|deposit|reserve|gcash|send)\w*.{0,20}\b(una|daan|muna|first)\b.{0,40}(view|visit|tan-?aw|tingnan|bisita|makita)/i,
      /bago (tingnan|bisitahin|makita|mag-?view).{0,30}(deposit|bayad|reserve)/i,
      /(hindi|di) pa (nakikita|pwede (tingnan|bisitahin))/i,
      /i-?reserve (mo )?(na|agad)/i,
      /(deposito?|bayad|reserve|kwarta).{0,40}\b(una|daan|dayon)\b.{0,40}(tan-?aw|bisita)/i,
      /(sa dili pa|sa wala pa|antes) .{0,20}(tan-?aw|bisita|makakita).{0,40}(deposito?|bayad|kwarta)/i,
      /(dili|wala) pa (matan-?aw|ma-?bisita)/i,
      /(bago|hindi pa|di pa|hangga't hindi).{0,20}(bumisita|makita|tumingin|tingnan|magpunta).{0,40}(deposit|bayad|bayaran|magbayad)/i,
      /(deposit|bayad|magbayad).{0,40}\bbago( pa)?\b.{0,20}(bumisita|makita|tumingin|tingnan)/i,
      /no (need|viewing) (to|for|required).{0,15}(view|see|visit)/i,
    ],
  },
  {
    category: "urgency",
    reason: "Pushes you to decide fast. Pressure is a common scam tactic.",
    patterns: [
      /\b(urgent|hurry|asap|right now|immediately)\b/i,
      /today only|last (slot|room|unit)|few (slots|rooms) left/i,
      /(many|others|other people) (are )?(interested|inquiring|waiting)/i,
      /first come,? first served/i,
      /(dalian|madali|agad|ngayon na|mabilis maubos|last slot na)/i,
      /\b(dali|dalia|paspas|karon (dayon|na)|ayaw (na )?(paglangan|pagdugay))\b/i,
      /(kulang na|isa na lang|usa na lang).{0,20}(slot|kwarto|unit)/i,
      /daghan (na|nang) (interesado|nangutana|naghulat)/i,
      /(bilisan|magmadali|kailangan (na )?ngayon|ngayong araw lang|konti (na )?lang)/i,
      /maraming (interesado|nagtatanong|naghihintay)/i,
      /(isa|iisa) na lang.{0,20}(kwarto|unit|slot)/i,
    ],
  },
];

/** Returns the original text around a match, trimmed to a readable quote. */
function quote(text: string, m: RegExpMatchArray): string {
  const start = Math.max(0, (m.index ?? 0) - 15);
  const end = Math.min(text.length, (m.index ?? 0) + m[0].length + 25);
  return text.slice(start, end).replace(/\s+/g, " ").trim().slice(0, 100);
}

export function ruleAnalysis(text: string): Analysis {
  const hits = new Set<Category>();
  const flagged: Flag[] = [];
  for (const rule of RULES) {
    for (const p of rule.patterns) {
      const m = text.match(p);
      if (m) {
        hits.add(rule.category);
        if (flagged.length < 5) flagged.push({ phrase: quote(text, m), reason: rule.reason });
        break; // one quote per category is enough
      }
    }
  }
  const high =
    hits.has("deposit_before_viewing") || hits.size >= 2;
  const risk: Risk = high ? "High" : hits.size === 1 ? "Medium" : "Low";
  const explanation =
    risk === "Low"
      ? "No common scam signs were found in this message. Still verify the landlord and view the place before paying."
      : risk === "Medium"
        ? "This message has one common scam sign. Be careful and verify the landlord before sending anything."
        : "This message has several common scam signs. Do not send any money before seeing the place in person.";
  return { risk, flagged, explanation };
}

const ORDER: Risk[] = ["Low", "Medium", "High"];
export const maxRisk = (a: Risk, b: Risk): Risk => (ORDER.indexOf(a) >= ORDER.indexOf(b) ? a : b);

/** Validates the model's JSON. Returns null if it can't be trusted. */
export function coerceAi(raw: unknown, message: string): Analysis | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const risk = ORDER.find((r) => r.toLowerCase() === String(o.risk ?? "").toLowerCase());
  if (!risk) return null;
  const lower = message.toLowerCase();
  const flagged = (Array.isArray(o.flagged) ? o.flagged : [])
    .map((f) => (f && typeof f === "object" ? (f as Record<string, unknown>) : {}))
    .map((f) => ({
      phrase: typeof f.phrase === "string" ? f.phrase.trim().slice(0, 100) : "",
      reason: typeof f.reason === "string" ? f.reason.trim().slice(0, 200) : "",
    }))
    // Drop invented quotes: the phrase must really appear in the student's message.
    .filter((f) => f.phrase && f.reason && lower.includes(f.phrase.toLowerCase()))
    .slice(0, 5);
  const explanation = typeof o.explanation === "string" ? o.explanation.trim().slice(0, 400) : "";
  if (!explanation) return null;
  return { risk, flagged, explanation };
}
