import { supabase } from "./supabase";

// One place to call every Edge Function
export async function callFn<T>(name: string, body: object = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    // Non-2xx replies carry our { error: { message } } body; show that instead of the generic text.
    let message = error.message ?? "Request failed";
    try {
      const res = (error as { context?: Response }).context;
      const body = res ? await res.json() : null;
      if (body?.error?.message) message = body.error.message;
    } catch {
      // keep the generic message
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error.message ?? "Request failed");
  return data as T;
}

export interface LeaseReview {
  summary: string;
  deposit: string;
  notice_period: string;
  utilities_included: string;
  penalties: string;
  flagged_clauses: { clause: string; reason: string }[];
}

/** AI lease summary (SRS 3.1.9). Needs a signed-in user. */
export async function submitLeaseReview(text: string): Promise<LeaseReview> {
  return callFn<LeaseReview>("submit-lease-review", { text });
}
