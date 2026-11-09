import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Card, Icon } from "../../components/kit";
import { colors } from "../../constants/brand";
import { fetchMyListings } from "../../lib/listings";
import { useApp } from "../../lib/store";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="w-[48%] p-3">
      <Text className="text-xl font-extrabold text-primary">{value}</Text>
      <Text className="mt-1 text-[11px] font-semibold text-muted-foreground">
        {label}
      </Text>
    </Card>
  );
}

export default function Overview() {
  const { account } = useApp();
  const accountId = account?.id;
  const [counts, setCounts] = useState<{
    active: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reload the counts every time this tab is opened.
  useFocusEffect(
    useCallback(() => {
      if (!accountId) return;
      let active = true;

      fetchMyListings(accountId)
        .then((rows) => {
          if (!active) return;
          setCounts({
            active: rows.filter((r) => r.is_active).length,
            total: rows.length,
          });
          setError(null);
        })
        .catch((e: unknown) => {
          if (!active) return;
          setError(
            e instanceof Error ? e.message : "Could not load your listings.",
          );
        });

      return () => {
        active = false;
      };
    }, [accountId]),
  );

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 px-4 pb-10"
    >
      {error ? (
        <Text className="rounded-2xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
          {error}
        </Text>
      ) : null}

      {!counts && !error ? (
        <View className="items-center py-6">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}

      {counts ? (
        <View className="flex-row flex-wrap justify-between gap-y-3">
          <Stat
            label="Active listings"
            value={`${counts.active}/${counts.total}`}
          />
          <Stat
            label="Inactive listings"
            value={`${counts.total - counts.active}`}
          />
        </View>
      ) : null}

      <Card className="gap-2 bg-primary/5">
        <View className="flex-row items-center gap-2">
          <Icon
            name="shield-checkmark-outline"
            size={16}
            color={colors.primary}
          />
          <Text className="text-sm font-extrabold text-primary">
            Student statistics
          </Text>
        </View>
        <Text className="text-[11px] text-muted-foreground">
          Student counts, likes and swipe activity are not shown yet. They need
          approval from the project team, because they use student data.
        </Text>
      </Card>
    </ScrollView>
  );
}
