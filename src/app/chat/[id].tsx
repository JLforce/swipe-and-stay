import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ModalHeader } from "../../components/AppHeader";
import { Icon } from "../../components/kit";
import { colors } from "../../constants/brand";
import { cn } from "../../lib/cn";
import {
  fetchConversations,
  fetchMessages,
  formatWhen,
  markConversationRead,
  MAX_MESSAGE_LENGTH,
  sendMessage,
  subscribeToMessages,
  type Message,
} from "../../lib/chat";
import { useApp } from "../../lib/store";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { account } = useApp();
  const myId = account?.id ?? null;

  const [title, setTitle] = useState("Chat");
  const [subtitle, setSubtitle] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<Message>>(null);

  // Add a message once, even if it arrives both from our own send and from realtime.
  const addMessage = useCallback((m: Message) => {
    setMessages((cur) => {
      const list = cur ?? [];
      if (list.some((x) => x.id === m.id)) return list;
      return [...list, m].sort((a, b) => a.created_at.localeCompare(b.created_at));
    });
  }, []);

  useEffect(() => {
    if (!id || !myId) return;
    let active = true;

    fetchConversations()
      .then((all) => {
        const c = all.find((x) => x.id === id);
        if (active && c) {
          setTitle(c.otherName);
          setSubtitle(c.listingTitle);
        }
      })
      .catch(() => undefined);

    fetchMessages(id)
      .then((rows) => {
        if (!active) return;
        setMessages(rows);
        void markConversationRead(id, myId);
      })
      .catch((e: unknown) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Could not load this chat.");
        setMessages([]);
      });

    const stop = subscribeToMessages(id, (m) => {
      addMessage(m);
      if (m.sender_id !== myId) void markConversationRead(id, myId);
    });

    return () => {
      active = false;
      stop();
    };
  }, [id, myId, addMessage]);

  async function send() {
    const text = draft.trim();
    if (!text || sending || !id || !myId) return;
    setSending(true);
    setError(null);
    try {
      const m = await sendMessage(id, myId, text);
      addMessage(m);
      setDraft("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send your message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background"
    >
      <ModalHeader title={subtitle ? `${title} · ${subtitle}` : title} onClose={() => router.back()} />

      {messages === null ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerClassName="gap-2 px-4 py-4"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <Text className="px-1 text-sm text-muted-foreground">No messages yet. Say hello!</Text>
          }
          renderItem={({ item }) => {
            const mine = item.sender_id === myId;
            return (
              <View className={cn("max-w-[80%] gap-1", mine ? "self-end" : "self-start")}>
                <View className={cn("rounded-3xl px-4 py-2.5", mine ? "rounded-br-lg bg-primary" : "rounded-bl-lg border border-border bg-card")}>
                  <Text className={cn("text-sm", mine ? "text-primary-foreground" : "text-foreground")}>{item.body}</Text>
                </View>
                <Text className={cn("px-1 text-[10px] text-muted-foreground", mine ? "text-right" : "text-left")}>
                  {formatWhen(item.created_at)}
                  {mine && item.read_at ? " · Seen" : ""}
                </Text>
              </View>
            );
          }}
        />
      )}

      {error ? (
        <Text className="mx-4 mb-2 rounded-2xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">{error}</Text>
      ) : null}

      <View
        className="flex-row items-end gap-2 border-t border-border bg-background px-4 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Write a message"
          placeholderTextColor={colors.mutedForeground}
          multiline
          maxLength={MAX_MESSAGE_LENGTH}
          className="max-h-28 flex-1 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
        />
        <Pressable
          onPress={send}
          disabled={sending || draft.trim().length === 0}
          accessibilityLabel="Send message"
          className={cn(
            "h-11 w-11 items-center justify-center rounded-full bg-primary active:opacity-80",
            (sending || draft.trim().length === 0) && "opacity-50",
          )}
        >
          <Icon name="send" size={18} color={colors.primaryForeground} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
