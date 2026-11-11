import { ActivityIndicator, Text, View } from "react-native";
import { colors } from "../../constants/brand";
import { ConversationCard, useConversations } from "../ConversationList";

/** Messages students sent about this owner's listings. */
export function InquiriesPanel() {
  const { rows, error } = useConversations();

  return (
    <View className="gap-3">
      {error ? (
        <Text className="rounded-2xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">{error}</Text>
      ) : null}
      {rows === null ? <ActivityIndicator color={colors.primary} /> : null}
      {rows?.length === 0 && !error ? (
        <Text className="px-1 text-sm text-muted-foreground">
          No inquiries yet. When a student messages you about a listing, it shows up here.
        </Text>
      ) : null}
      {rows?.map((c) => <ConversationCard key={c.id} c={c} actionLabel="Reply" quoted />)}
    </View>
  );
}
