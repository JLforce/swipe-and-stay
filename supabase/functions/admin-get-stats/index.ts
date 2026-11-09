// POST {} -> { stats, students }
// Admin dashboard data (SRS 3.1.11, SDD admin-get-stats): usage counts and the registered student list.
// Row Level Security only lets a user read their own profile and swipes, so this runs with server
// rights, but only after checking in the database that the caller really is an admin.
import { adminClient, corsHeaders, fail, json, userClient } from "../_shared/http.ts";

const STUDENT_LIMIT = 200; // newest first; enough for the pilot
const SWIPE_ROW_LIMIT = 20000; // rows read to count swipes per student

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return fail("Use POST.", 405);

  const session = await userClient(req);
  if (!session) return fail("Please sign in first.", 401, "unauthorized");

  const db = adminClient();

  // The role comes from the database, never from the request.
  const { data: me, error: meErr } = await db.from("profiles").select("role").eq("id", session.userId).maybeSingle();
  if (meErr) return fail("Could not check your account. Try again.", 500);
  if (me?.role !== "admin") return fail("Admin access only.", 403, "forbidden");

  const count = (q: PromiseLike<{ count: number | null; error: unknown }>) =>
    q.then((r) => (r.error ? null : (r.count ?? 0)));

  const [activeListings, totalListings, students, swipes, likes, studentRows, swipeRows, campusRows] = await Promise.all([
    count(db.from("listings").select("*", { count: "exact", head: true }).eq("is_active", true)),
    count(db.from("listings").select("*", { count: "exact", head: true })),
    count(db.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student")),
    count(db.from("swipes").select("*", { count: "exact", head: true })),
    count(db.from("swipes").select("*", { count: "exact", head: true }).eq("direction", "right")),
    db
      .from("profiles")
      .select("id, full_name, email, program, campus_id, onboarding_completed, created_at")
      .eq("role", "student")
      .order("created_at", { ascending: false })
      .limit(STUDENT_LIMIT),
    db.from("swipes").select("user_id").limit(SWIPE_ROW_LIMIT),
    db.from("campuses").select("id, short_name"),
  ]);

  if (studentRows.error) {
    console.error("admin-get-stats students failed:", studentRows.error.message);
    return fail("Could not load the dashboard. Try again.", 500);
  }

  const campusName = new Map<string, string>((campusRows.data ?? []).map((c) => [c.id as string, c.short_name as string]));
  const swipesBy = new Map<string, number>();
  for (const s of swipeRows.data ?? []) swipesBy.set(s.user_id as string, (swipesBy.get(s.user_id as string) ?? 0) + 1);

  return json({
    stats: {
      active_listings: activeListings,
      total_listings: totalListings,
      registered_students: students,
      total_swipes: swipes,
      total_likes: likes,
      swipe_sessions: swipesBy.size, // students who have started swiping
    },
    students: (studentRows.data ?? []).map((p) => ({
      id: p.id,
      name: p.full_name ?? null,
      email: p.email ?? null,
      campus: p.campus_id ? (campusName.get(p.campus_id as string) ?? null) : null,
      program: p.program ?? null,
      onboarding_completed: !!p.onboarding_completed,
      joined_at: p.created_at,
      swipes: swipesBy.get(p.id as string) ?? 0,
    })),
  });
});
