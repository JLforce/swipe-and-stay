import type { Tables } from "../types/database";
import { supabase } from "./supabase";

export type Message = Tables<"messages">;

export interface ConversationSummary {
  id: string;
  listingId: string;
  listingTitle: string;
  otherName: string;
  lastBody: string | null;
  lastAt: string;
  lastFromMe: boolean;
  unreadCount: number;
}

export const MAX_MESSAGE_LENGTH = 2000;

/** Inbox for the signed-in student or owner, newest first. */
export async function fetchConversations(): Promise<ConversationSummary[]> {
  const { data, error } = await supabase.rpc("my_conversations");
  if (error) throw new Error(error.message);

  return (data ?? []).map((r) => ({
    id: r.id,
    listingId: r.listing_id,
    listingTitle: r.listing_title,
    otherName: r.other_name,
    lastBody: r.last_body,
    lastAt: r.last_at,
    lastFromMe: r.last_from_me,
    unreadCount: Number(r.unread_count),
  }));
}

/** Student: send the first message about a listing (or continue the chat). */
export async function startConversation(
  listingId: string,
  body: string,
): Promise<string> {
  const { data, error } = await supabase.rpc("start_conversation", {
    p_listing_id: listingId,
    p_body: body,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(500);

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Either side: send a message in an existing conversation. */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  body: string,
): Promise<Message> {
  const text = body.trim();
  if (!text) throw new Error("Please write a message.");
  if (text.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Messages can be at most ${MAX_MESSAGE_LENGTH} characters.`);
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, body: text })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Marks the other person's unread messages in this chat as read. */
export async function markConversationRead(
  conversationId: string,
  myId: string,
): Promise<void> {
  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", myId)
    .is("read_at", null);

  if (error) console.warn("Could not mark messages as read", error.message);
}

/**
 * Calls onMessage for every new message in one chat. Returns a function that
 * stops listening. Row Level Security still decides what each person receives.
 */
export function subscribeToMessages(
  conversationId: string,
  onMessage: (m: Message) => void,
): () => void {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onMessage(payload.new as Message),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/** Calls onChange whenever a message arrives for the signed-in user's inbox. */
export function subscribeToInbox(onChange: () => void): () => void {
  const channel = supabase
    .channel(`inbox:${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "messages" },
      () => onChange(),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/** "9:33 AM" for today, "Yesterday", a weekday this week, otherwise a date. */
export function formatWhen(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const startOfDay = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);

  if (days <= 0) {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}
