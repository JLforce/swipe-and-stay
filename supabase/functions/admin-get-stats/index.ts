// POST { days?: 7 | 30 } -> { stats, most_liked, weekly_swipes, students, analytics }
// Admin dashboard data (SRS 3.1.11).
// Server-side queries use adminClient only after verifying the caller's database role.

import {
  adminClient,
  corsHeaders,
  fail,
  json,
  userClient,
} from "../_shared/http.ts";

const STUDENT_LIMIT = 200;
const SWIPE_ROW_LIMIT = 20000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return fail("Use POST.", 405);
  }

  const session = await userClient(req);

  if (!session) {
    return fail("Please sign in first.", 401, "unauthorized");
  }

  const db = adminClient();

  // Verify the caller's role using the database, never the request body.
  const { data: me, error: meErr } = await db
    .from("profiles")
    .select("role")
    .eq("id", session.userId)
    .maybeSingle();

  if (meErr) {
    return fail("Could not check your account. Try again.", 500);
  }

  if (me?.role !== "admin") {
    return fail("Admin access only.", 403, "forbidden");
  }

  // Accept only the supported reporting periods.
  const body = await req.json().catch(() => ({}));
  const days: 7 | 30 = body?.days === 30 ? 30 : 7;

  const count = (q: PromiseLike<{ count: number | null; error: unknown }>) =>
    q.then((r) => (r.error ? null : (r.count ?? 0)));

  const [
    activeListings,
    totalListings,
    students,
    swipes,
    likes,
    studentRows,
    swipeRows,
    campusRows,
    analyticsResult,
  ] = await Promise.all([
    count(
      db
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
    ),

    count(db.from("listings").select("*", { count: "exact", head: true })),

    count(
      db
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student"),
    ),

    count(db.from("swipes").select("*", { count: "exact", head: true })),

    count(
      db
        .from("swipes")
        .select("*", { count: "exact", head: true })
        .eq("direction", "right")
        .is("unliked_at", null),
    ),

    db
      .from("profiles")
      .select(
        "id, full_name, email, program, campus_id, onboarding_completed, created_at",
      )
      .eq("role", "student")
      .order("created_at", { ascending: false })
      .limit(STUDENT_LIMIT),

    db
      .from("swipes")
      .select("user_id, listing_id, direction, swiped_at, unliked_at")
      .order("swiped_at", { ascending: false })
      .limit(SWIPE_ROW_LIMIT),

    db.from("campuses").select("id, short_name"),

    db.rpc("admin_dashboard_analytics", {
      p_days: days,
    }),
  ]);

  if (studentRows.error) {
    console.error(
      "admin-get-stats students failed:",
      studentRows.error.message,
    );
    return fail("Could not load the dashboard. Try again.", 500);
  }

  if (analyticsResult.error) {
    console.error(
      "admin-get-stats analytics failed:",
      analyticsResult.error.message,
    );
    return fail("Could not load dashboard analytics. Try again.", 500);
  }

  const analytics = analyticsResult.data;

  if (!analytics) {
    console.error("admin-get-stats analytics returned no data.");
    return fail("Could not load dashboard analytics. Try again.", 500);
  }

  // Campus names for the student list.
  const campusName = new Map<string, string>(
    (campusRows.data ?? []).map((c) => [
      c.id as string,
      c.short_name as string,
    ]),
  );

  // Swipe counts per student for the existing Students screen.
  const swipesBy = new Map<string, number>();

  for (const s of swipeRows.data ?? []) {
    const userId = s.user_id as string;

    swipesBy.set(userId, (swipesBy.get(userId) ?? 0) + 1);
  }

  // Preserve the existing response fields for compatibility.
  const mostLiked = analytics.most_liked ?? [];

  const weeklySwipes = (analytics.daily_activity ?? []).map(
    (day: { date: string; swipes: number; likes: number; passes: number }) => ({
      day: day.date,
      n: day.swipes,
    }),
  );

  return json({
    stats: {
      active_listings: activeListings,
      total_listings: totalListings,
      registered_students: students,
      total_swipes: swipes,
      total_likes: likes,
      swipe_sessions: analytics.engagement.students_who_swiped,
    },

    most_liked: mostLiked,
    weekly_swipes: weeklySwipes,

    analytics,

    students: (studentRows.data ?? []).map((p) => ({
      id: p.id,
      name: p.full_name ?? null,
      email: p.email ?? null,
      campus: p.campus_id
        ? (campusName.get(p.campus_id as string) ?? null)
        : null,
      program: p.program ?? null,
      onboarding_completed: !!p.onboarding_completed,
      joined_at: p.created_at,
      swipes: swipesBy.get(p.id as string) ?? 0,
    })),
  });
});
