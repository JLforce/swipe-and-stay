// Stand-ins for the Supabase Edge Functions. Later, replace the body of each function with
// `callFn("submit-lease-review", { text })` (roadmap Section 4.7) and keep the signatures.
import { SAMPLE_LEASE_RESULT, type LeaseResult } from "../data/mockData";

export async function submitLeaseReview(text: string): Promise<LeaseResult> {
  await new Promise((r) => setTimeout(r, 1500)); // simulates the 5–10 s LLM call (SRS 3.4)
  if (text.trim().length < 40) throw new Error("Please paste more of the lease text.");
  return SAMPLE_LEASE_RESULT;
}
