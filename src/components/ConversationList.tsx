import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import { colors } from "../constants/brand";
import {
  fetchConversations,
  formatWhen,
  subscribeToInbox,
  type ConversationSummary,
} from "../lib/chat";
import { Btn, Card, Tag } from "./kit";
import type { ReactNode } from "react";

/**
 * Inbox used by both sides. Owners see student inquiries; students see owner replies.
 * Refreshes when the screen is focused and whenever a message arrives.
 */
export function ConversationList({
  header,
  emptyText,
  actionLabel,
}: {
  header?: ReactNode;
  emptyText: string;
  actionLabel: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<ConversationSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await fetchConversations());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load messages.");
      setRows((cur) => cur ?? []);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => subscribeToInbox(() => void load()), [load]);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-3 px-4 pb-10"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.primary}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      }
    >
      {header}
      {error ? (
        <Text className="rounded-2xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">{error}</Text>
      ) : null}
      {rows === null ? <ActivityIndicator color={colors.primary} className="mt-6" /> : null}
      {rows?.length === 0 && !error ? (
        <Text className="px-1 text-sm text-muted-foreground">{emptyText}</Text>
      ) : null}
      {rows?.map((c) => (
        <Card key={c.id} className="gap-2 p-3.5">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="flex-1 text-sm font-extrabold text-foreground" numberOfLines={1}>
              {c.otherName}
            </Text>
            {c.unreadCount > 0 ? (
              <Tag tone="accent">{c.unreadCount > 1 ? `${c.unreadCount} new` : "New"}</Tag>
            ) : c.lastFromMe ? (
              <Tag tone="primary">Replied</Tag>
            ) : null}
          </View>
          <Text className="text-[11px] text-muted-foreground" numberOfLines={1}>
            {c.listingTitle}
          </Text>
          <Text className="text-sm text-foreground/85" numberOfLines={2}>
            {c.lastFromMe ? "You: " : ""}
            {c.lastBody ?? ""}
          </Text>
          <View className="flex-row items-center justify-between">
            <Text className="text-[11px] text-muted-foreground">{formatWhen(c.lastAt)}</Text>
            <Btn
              label={actionLabel}
              className="px-4 py-2"
              onPress={() => router.push({ pathname: "/chat/[id]", params: { id: c.id } })}
            />
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}
