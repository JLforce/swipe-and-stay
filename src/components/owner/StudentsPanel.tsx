import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { colors } from "../../constants/brand";
import { supabase } from "../../lib/supabase";
import { Card } from "../kit";

interface InterestedStudent {
  full_name: string;
  campus: string | null;
  saved_count: number;
  swipe_count: number;
  joined_at: string;
}

function day(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

/** Students who saved one of this owner's places. Monitoring details only. */
export function StudentsPanel({ reloadKey }: { reloadKey: number }) {
  const [rows, setRows] = useState<InterestedStudent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase.rpc("owner_interested_students").then(({ data, error: err }) => {
      if (!active) return;
      if (err) {
        setError(err.message);
        setRows((cur) => cur ?? []);
        return;
      }
      setError(null);
      setRows(
        (data ?? []).map((r) => ({
          full_name: r.full_name,
          campus: r.campus,
          joined_at: r.joined_at,
          saved_count: Number(r.saved_count),
          swipe_count: Number(r.swipe_count),
        })),
      );
    });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  return (
    <View className="gap-3">
      {error ? (
        <Text className="rounded-2xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">{error}</Text>
      ) : null}
      {rows === null ? <ActivityIndicator color={colors.primary} /> : null}
      {rows?.length === 0 && !error ? (
        <Text className="px-1 text-sm text-muted-foreground">
          No student has saved one of your places yet. Make sure your listings are live and have photos.
        </Text>
      ) : null}
      {rows?.map((s, i) => (
        <Card key={`${s.full_name}-${s.joined_at}-${i}`} className="flex-row items-center gap-3">
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
              {s.full_name}
            </Text>
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
        Owners see monitoring details only — never a student&apos;s contact information.
      </Text>
    </View>
  );
}
