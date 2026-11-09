import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Card, Icon } from "../../components/kit";
import { colors } from "../../constants/brand";
import { adminGetStats, type AdminStudent } from "../../lib/api";
import { useApp } from "../../lib/store";

function initials(s: AdminStudent): string {
  const source = (s.name ?? s.email ?? "?").trim();
  return (
    source
      .split(/[\s@.]+/)
      .filter(Boolean)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

export default function Students() {
  const { account } = useApp();
  const accountId = account?.id;
  const [students, setStudents] = useState<AdminStudent[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  // Reload the list every time this tab is opened.
  useFocusEffect(
    useCallback(() => {
      if (!accountId) return;
      let active = true;

      adminGetStats()
        .then((res) => {
          if (!active) return;
          setStudents(res.students);
          setTotal(res.stats.registered_students);
          setError(null);
        })
        .catch((e: unknown) => {
          if (!active) return;
          setError(
            e instanceof Error ? e.message : "Could not load the students.",
          );
        });

      return () => {
        active = false;
      };
    }, [accountId]),
  );

  const rows = (students ?? []).filter((s) =>
    `${s.name ?? ""} ${s.email ?? ""} ${s.campus ?? ""}`
      .toLowerCase()
      .includes(q.trim().toLowerCase()),
  );

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-3 px-4 pb-10"
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4">
        <Icon name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search name, email or school"
          placeholderTextColor={colors.mutedForeground}
          className="flex-1 py-3 text-sm text-foreground"
        />
      </View>

      {error ? (
        <Text className="rounded-2xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
          {error}
        </Text>
      ) : null}

      {!students && !error ? (
        <View className="items-center py-6">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}

      {students ? (
        <Text className="text-xs text-muted-foreground">
          {rows.length} of {total ?? students.length} registered accounts
        </Text>
      ) : null}

      {rows.map((s) => (
        <Card key={s.id} className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
            <Text className="text-xs font-extrabold text-primary">
              {initials(s)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-foreground">
              {s.name ?? s.email ?? "Unnamed student"}
            </Text>
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              {s.email ?? "No email"} · {s.campus ?? "No campus yet"}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-sm font-extrabold text-primary">
              {s.swipes}
            </Text>
            <Text className="text-[11px] text-muted-foreground">swipes</Text>
          </View>
        </Card>
      ))}

      {students && rows.length === 0 ? (
        <Text className="px-1 text-sm text-muted-foreground">
          No students found.
        </Text>
      ) : null}
    </ScrollView>
  );
}
