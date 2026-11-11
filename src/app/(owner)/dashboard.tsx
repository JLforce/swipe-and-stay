import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, type IconName } from "../../components/kit";
import { InquiriesPanel } from "../../components/owner/InquiriesPanel";
import { ListingsPanel } from "../../components/owner/ListingsPanel";
import { StudentsPanel } from "../../components/owner/StudentsPanel";
import { OwnerStatsGrid, OwnerTip } from "../../components/OwnerStats";
import { colors } from "../../constants/brand";
import { cn } from "../../lib/cn";
import { useOwner } from "../../lib/owner";
import { useApp } from "../../lib/store";

type TabId = "listings" | "students" | "inquiries";

const TABS: { id: TabId; label: string; icon: IconName }[] = [
  { id: "listings", label: "Listings", icon: "business-outline" },
  { id: "students", label: "Students", icon: "people-outline" },
  { id: "inquiries", label: "Inquiries", icon: "chatbubble-outline" },
];

export default function OwnerDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { account, signOut } = useApp();
  const { refresh } = useOwner();
  const [tab, setTab] = useState<TabId>("listings");
  const [refreshing, setRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center justify-between gap-3 px-4 pb-3">
        <View className="min-w-0 flex-1 flex-row items-center gap-2">
          <View className="h-9 w-9 items-center justify-center rounded-2xl bg-primary">
            <Icon name="business" size={16} color={colors.primaryForeground} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-base font-extrabold leading-none text-foreground" numberOfLines={1}>
              Owner dashboard
            </Text>
            <Text className="text-[11px] text-muted-foreground" numberOfLines={1}>
              {account?.name ?? "Owner"} · Cebu City
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => {
            signOut();
            router.replace("/login");
          }}
          accessibilityLabel="Sign out"
          className="h-10 w-10 items-center justify-center rounded-full border border-border bg-card active:opacity-70"
        >
          <Icon name="log-out-outline" size={18} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerClassName="gap-4 px-4 pb-12"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.primary}
            onRefresh={async () => {
              setRefreshing(true);
              await refresh();
              setReloadKey((k) => k + 1);
              setRefreshing(false);
            }}
          />
        }
      >
        <OwnerStatsGrid />
        <OwnerTip />

        <View className="flex-row gap-2 rounded-3xl bg-secondary p-1.5">
          {TABS.map((t) => {
            const on = tab === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => setTab(t.id)}
                className={cn("flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl px-2 py-2.5", on && "bg-card")}
              >
                <Icon name={t.icon} size={14} color={on ? colors.primary : colors.mutedForeground} />
                <Text className={cn("text-[11px] font-extrabold", on ? "text-primary" : "text-muted-foreground")}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {tab === "listings" ? <ListingsPanel /> : null}
        {tab === "students" ? <StudentsPanel reloadKey={reloadKey} /> : null}
        {tab === "inquiries" ? <InquiriesPanel /> : null}
      </ScrollView>
    </View>
  );
}
