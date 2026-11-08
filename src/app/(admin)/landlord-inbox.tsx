import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Btn, Card } from "../../components/kit";
import { colors } from "../../constants/brand";
import { conversationsStore } from "../../lib/landlordStore";

const time = (at: number) => new Date(at).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });

export default function LandlordInbox() {
  const [chats] = conversationsStore.use();
  const [openId, setOpenId] = useState<string | null>(null);
  const [text, setText] = useState("");

  const open = chats.find((c) => c.id === openId) ?? null;

  function openChat(id: string) {
    setOpenId(id);
    conversationsStore.set((p) => p.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
  }

  function send() {
    const t = text.trim();
    if (!t || !open) return;
    conversationsStore.set((p) =>
      p.map((c) =>
        c.id === open.id ? { ...c, messages: [...c.messages, { id: String(Date.now()), from: "landlord", text: t, at: Date.now() }] } : c,
      ),
    );
    setText("");
  }

  if (open) {
    return (
      <View className="flex-1 bg-background">
        <View className="flex-row items-center gap-3 px-4 pb-2">
          <Btn variant="outline" label="Back" className="px-3 py-2" onPress={() => setOpenId(null)} />
          <View className="flex-1">
            <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
              {open.studentName}
            </Text>
            <Text className="text-[11px] text-muted-foreground" numberOfLines={1}>
              About: {open.listingTitle}
            </Text>
          </View>
        </View>

        <ScrollView contentContainerClassName="gap-2 px-4 pb-4">
          {open.messages.map((m) => (
            <View key={m.id} className={m.from === "landlord" ? "items-end" : "items-start"}>
              <View className={m.from === "landlord" ? "max-w-[80%] rounded-2xl bg-primary px-3 py-2" : "max-w-[80%] rounded-2xl bg-secondary px-3 py-2"}>
                <Text className={m.from === "landlord" ? "text-sm text-white" : "text-sm text-foreground"}>{m.text}</Text>
              </View>
              <Text className="mt-0.5 text-[10px] text-muted-foreground">{time(m.at)}</Text>
            </View>
          ))}
        </ScrollView>

        <View className="flex-row items-center gap-2 border-t border-border bg-card px-4 py-3">
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type a reply"
            placeholderTextColor={colors.mutedForeground}
            className="flex-1 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground"
          />
          <Btn label="Send" className="px-4 py-3" onPress={send} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-3 px-4 pb-10">
      {chats.map((c) => {
        const last = c.messages[c.messages.length - 1];
        return (
          <Pressable key={c.id} onPress={() => openChat(c.id)}>
            <Card className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <Text className="text-xs font-extrabold text-primary">
                  {c.studentName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
                  {c.studentName}
                </Text>
                <Text className="text-[11px] text-muted-foreground" numberOfLines={1}>
                  About: {c.listingTitle}
                </Text>
                {last ? (
                  <Text className="text-xs text-foreground" numberOfLines={1}>
                    {last.text}
                  </Text>
                ) : null}
              </View>
              {c.unread > 0 ? (
                <View className="h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5">
                  <Text className="text-[11px] font-extrabold text-white">{c.unread}</Text>
                </View>
              ) : null}
            </Card>
          </Pressable>
        );
      })}

      {chats.length === 0 ? (
        <Card className="gap-1">
          <Text className="text-sm font-bold text-foreground">No messages yet</Text>
          <Text className="text-sm text-muted-foreground">
            When a student messages you about a listing, the conversation will show up here.
          </Text>
        </Card>
      ) : null}
    </ScrollView>
  );
}