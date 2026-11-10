import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import { Card } from "../../components/kit";
import { OwnerStatsGrid } from "../../components/OwnerStats";
import { colors } from "../../constants/brand";
import { supabase } from "../../lib/supabase";

interface InterestedStudent {
  full_name: string;
  campus: string | null;
  saved_count: number;
  swipe_count: number;
  last_activity: string;
  joined_at: string;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function day(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export default function InterestedStudents() {
  const [rows, setRows] = useState<InterestedStudent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data, error: err } = await supabase.rpc("owner_interested_students");
    if (err) {
      setError(err.message);
      setRows((cur) => cur ?? []);
      return;
    }
    setError(null);
    setRows(
      (data ?? []).map((r) => ({
        ...r,
        saved_count: Number(r.saved_count),
        swipe_count: Number(r.swipe_count),
      })),
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

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
      <OwnerStatsGrid />
      {error ? (
        <Text className="rounded-2xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">{error}</Text>
      ) : null}
      {rows === null ? <ActivityIndicator color={colors.primary} className="mt-4" /> : null}
      {rows?.length === 0 && !error ? (
        <Text className="px-1 text-sm text-muted-foreground">
          No student has saved one of your places yet. Make sure your listings are live and have photos.
        </Text>
      ) : null}
      {rows?.map((s, i) => (
        <Card key={`${s.full_name}-${s.joined_at}-${i}`} className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
            <Text className="text-xs font-extrabold text-primary">{initials(s.full_name)}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-foreground">{s.full_name}</Text>
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              {s.campus ? `${s.campus} · ` : ""}joined {day(s.joined_at)}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-sm font-extrabold text-primary">{s.swipe_count}</Text>
            <Text className="text-[11px] text-muted-foreground">{s.saved_count} saved</Text>
          </View>
        </Card>
      ))}
      <Text className="px-1 text-[11px] text-muted-foreground">
        Owners see monitoring details only, never a student&apos;s contact information. Students reach you by messaging you.
      </Text>
    </ScrollView>
  );
}
