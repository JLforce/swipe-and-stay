import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Card, SectionTitle } from "../../components/kit";
import { colors } from "../../constants/brand";
import { adminGetStats, type AdminStats } from "../../lib/api";
import { useApp } from "../../lib/store";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function num(n: number | null | undefined): string {
  return n === null || n === undefined ? "–" : String(n);
}

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
  const [data, setData] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reload the numbers every time this tab is opened.
  useFocusEffect(
    useCallback(() => {
      if (!accountId) return;
      let active = true;

      adminGetStats()
        .then((res) => {
          if (!active) return;
          setData(res);
          setError(null);
        })
        .catch((e: unknown) => {
          if (!active) return;
          setError(
            e instanceof Error ? e.message : "Could not load the dashboard.",
          );
        });

      return () => {
        active = false;
      };
    }, [accountId]),
  );

  const weekly = data?.weekly_swipes ?? [];
  const max = Math.max(1, ...weekly.map((d) => d.n));
  const mostLiked = data?.most_liked ?? [];

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

      {!data && !error ? (
        <View className="items-center py-6">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}

      {data ? (
        <>
          <View className="flex-row flex-wrap justify-between gap-y-3">
            <Stat
              label="Active listings"
              value={`${num(data.stats.active_listings)}/${num(data.stats.total_listings)}`}
            />
            <Stat
              label="Registered students"
              value={num(data.stats.registered_students)}
            />
            <Stat label="Total likes" value={num(data.stats.total_likes)} />
            <Stat
              label="Card views (swipes)"
              value={num(data.stats.total_swipes)}
            />
          </View>

          <Card className="gap-3">
            <Text className="text-sm font-extrabold text-foreground">
              Swipes this week
            </Text>
            {weekly.length > 0 ? (
              <View className="h-28 flex-row items-end justify-between gap-2">
                {weekly.map((d) => (
                  <View key={d.day} className="flex-1 items-center gap-1">
                    <View
                      className="w-full rounded-t-xl bg-primary"
                      style={{ height: Math.max(8, (d.n / max) * 90) }}
                    />
                    <Text className="text-[10px] text-muted-foreground">
                      {DAY_NAMES[new Date(`${d.day}T00:00:00Z`).getUTCDay()]}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-xs text-muted-foreground">
                No weekly data yet.
              </Text>
            )}
          </Card>

          <View>
            <SectionTitle>Most liked</SectionTitle>
            <Card className="gap-3">
              {mostLiked.length === 0 ? (
                <Text className="text-xs text-muted-foreground">
                  No likes yet.
                </Text>
              ) : (
                mostLiked.slice(0, 3).map((m, i) => (
                  <View
                    key={m.listing_id}
                    className="flex-row items-center gap-3"
                  >
                    <View className="h-7 w-7 items-center justify-center rounded-full bg-secondary">
                      <Text className="text-xs font-extrabold text-primary">
                        {i + 1}
                      </Text>
                    </View>
                    <Text
                      className="flex-1 text-sm font-semibold text-foreground"
                      numberOfLines={1}
                    >
                      {m.title}
                    </Text>
                    <Text className="text-sm font-bold text-muted-foreground">
                      ♡ {m.likes}
                    </Text>
                  </View>
                ))
              )}
            </Card>
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}
