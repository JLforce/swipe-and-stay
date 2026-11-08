// Shared HTTP helpers for all Edge Functions.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Same shape the app's callFn() reads: { error: { message } }. */
export function fail(message: string, status = 400, code?: string): Response {
  return json({ error: { message, code } }, status);
}

/**
 * Client that acts as the signed-in user, so Postgres RLS still applies.
 * Returns null when the request has no valid user session.
 */
export async function userClient(req: Request): Promise<{ db: SupabaseClient; userId: string } | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });
  const { data, error } = await db.auth.getUser(auth.slice("Bearer ".length));
  if (error || !data.user) return null;
  return { db, userId: data.user.id };
}

/** Server-only client that bypasses RLS. Use only for writes users aren't allowed to make. */
export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
}
