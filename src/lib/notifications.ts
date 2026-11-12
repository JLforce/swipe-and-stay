import type { AppNotification } from "../data/mockData";
import type { Tables } from "../types/database";
import { formatWhen } from "./chat";
import { supabase } from "./supabase";

type NotificationRow = Tables<"notifications">;

function toAppNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    kind:
      row.type === "new_match"
        ? "match"
        : row.type === "listing_deactivated"
          ? "deactivated"
          : "info",
    title: row.title,
    body: row.body ?? "",
    time: formatWhen(row.created_at),
    read: row.read_at !== null,
    listingId: row.listing_id ?? undefined,
  };
}

/** Database rows first, then the local ones, with no duplicate ids. */
export function mergeNotifications(
  incoming: AppNotification[],
  current: AppNotification[],
): AppNotification[] {
  const ids = new Set(incoming.map((n) => n.id));
  // Local notes have no timestamp, so keep them first (they are always recent).
  const local = current.filter((n) => !ids.has(n.id) && n.time === "Just now");
  const rest = current.filter((n) => !ids.has(n.id) && n.time !== "Just now");
  return [...local, ...incoming, ...rest];
}

/** The signed-in student's latest notifications, newest first. */
export async function fetchNotifications(): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data ?? []).map(toAppNotification);
}

/** Marks all of this student's unread notifications as read. */
export async function markNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) throw new Error(error.message);
}

/**
 * Calls onInsert for every new notification for this user. Returns a function
 * that stops listening. Row Level Security still decides what is delivered.
 */
export function subscribeToNotifications(
  userId: string,
  onInsert: (n: AppNotification) => void,
): () => void {
  const channel = supabase
    .channel(`notifications:${userId}:${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onInsert(toAppNotification(payload.new as NotificationRow)),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
