import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, type IconName } from "../components/kit";
import { colors } from "../constants/brand";
import type { AppNotification } from "../data/mockData";
import { cn } from "../lib/cn";
import { useApp } from "../lib/store";

const STYLE: Record<
  AppNotification["kind"],
  { icon: IconName; color: string; circle: string; card: string }
> = {
  match: {
    icon: "sparkles",
    color: colors.primary,
    circle: "bg-secondary",
    card: "border-border bg-card",
  },
  rerank: {
    icon: "sparkles",
    color: colors.primary,
    circle: "bg-secondary",
    card: "border-border bg-card",
  },
  lease: {
    icon: "document-text-outline",
    color: colors.primary,
    circle: "bg-secondary",
    card: "border-border bg-card",
  },
  info: {
    icon: "information-circle-outline",
    color: colors.accent,
    circle: "bg-accent/15",
    card: "border-border bg-card",
  },
  deactivated: {
    icon: "warning-outline",
    color: colors.destructive,
    circle: "bg-destructive/10",
    card: "border-destructive/30 bg-destructive/10",
  },
};

/** Bottom-sheet notification feed (transparentModal, see _layout.tsx). */
export default function Notifications() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { notifications, markAllRead } = useApp();

  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  const openListing = (n: AppNotification) => {
    if (!n.listingId) return;
    router.back();
    router.push({ pathname: "/listing/[id]", params: { id: n.listingId } });
  };

  return (
    <View className="flex-1 justify-end">
      <Pressable
        accessibilityLabel="Close notifications"
        onPress={() => router.back()}
        className="absolute inset-0 bg-black/40"
      />
      <View
        className="max-h-[85%] rounded-t-[32px] bg-background"
        style={{ paddingBottom: insets.bottom + 8 }}
      >
        <View className="flex-row items-center justify-between px-5 pb-4 pt-5">
          <Text className="text-lg font-extrabold text-foreground">
            Notifications
          </Text>
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Close"
            className="h-10 w-10 items-center justify-center rounded-full bg-secondary active:opacity-70"
          >
            <Icon name="close" size={18} color={colors.secondaryForeground} />
          </Pressable>
        </View>
        <View className="h-px bg-border" />

        <ScrollView
          style={{ flexGrow: 0 }}
          contentContainerClassName="gap-3 px-4 pb-4 pt-4"
        >
          <View className="flex-row items-center gap-2 px-1">
            <Icon
              name="notifications-outline"
              size={14}
              color={colors.mutedForeground}
            />
            <Text className="text-xs text-muted-foreground">
              Activity from your swipes, matches and lease reviews
            </Text>
          </View>

          {notifications.length === 0 ? (
            <Text className="px-1 py-6 text-center text-sm text-muted-foreground">
              Nothing new yet.
            </Text>
          ) : null}

          {notifications.map((n) => {
            const st = STYLE[n.kind];
            return (
              <Pressable
                key={n.id}
                disabled={!n.listingId}
                onPress={() => openListing(n)}
                className={cn(
                  "flex-row gap-3 rounded-3xl border p-4 active:opacity-80",
                  st.card,
                )}
              >
                <View
                  className={cn(
                    "h-10 w-10 items-center justify-center rounded-full",
                    st.circle,
                  )}
                >
                  <Icon name={st.icon} size={18} color={st.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-foreground">
                    {n.title}
                  </Text>
                  <Text className="mt-1 text-sm leading-5 text-foreground/75">
                    {n.body}
                  </Text>
                  <Text className="mt-2 text-[11px] text-muted-foreground">
                    {n.time}
                  </Text>
                </View>
              </Pressable>
            );
          })}

          <View className="flex-row items-center justify-center gap-1.5 pt-1">
            <Icon
              name="star-outline"
              size={12}
              color={colors.mutedForeground}
            />
            <Text className="text-[11px] text-muted-foreground">
              Sample activity feed
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
