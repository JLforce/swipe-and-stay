import { supabase } from "./supabase";

// One place to call every Edge Function
export async function callFn<T>(name: string, body: object = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let message = error.message ?? "Request failed";
    try {
      const res = (error as { context?: Response }).context;
      const body = res ? await res.json() : null;
      if (body?.error?.message) message = body.error.message;
    } catch {}
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

export interface AdminStudent {
  id: string;
  name: string | null;
  email: string | null;
  campus: string | null;
  program: string | null;
  onboarding_completed: boolean;
  joined_at: string;
  swipes: number;
}

export interface AdminDashboardAnalytics {
  period: {
    days: number;
    timezone: string;
  };
  engagement: {
    total_swipes: number;
    total_likes: number;
    total_passes: number;
    students_who_swiped: number;
  };
  daily_activity: {
    date: string;
    swipes: number;
    likes: number;
    passes: number;
  }[];
  daily_registrations: {
    date: string;
    students: number;
  }[];
  most_liked: {
    listing_id: string;
    title: string;
    likes: number;
  }[];
}

export interface AdminStats {
  stats: {
    active_listings: number | null;
    total_listings: number | null;
    registered_students: number | null;
    total_swipes: number | null;
    total_likes: number | null;
    swipe_sessions: number;
  };
  most_liked?: {
    listing_id: string;
    title: string;
    likes: number;
  }[];
  weekly_swipes?: {
    day: string;
    n: number;
  }[];
  students: AdminStudent[];
  analytics?: AdminDashboardAnalytics;
}

/** Admin dashboard numbers and the student list (SRS 3.1.11). Admin only. */
export async function adminGetStats(days: 7 | 30 = 7): Promise<AdminStats> {
  return callFn<AdminStats>("admin-get-stats", { days });
}
