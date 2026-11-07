import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { Card, Icon } from "../../components/kit";
import { colors } from "../../constants/brand";
import { STUDENT_ACCOUNTS } from "../../data/mockData";

export default function Students() {
  const [q, setQ] = useState("");
  const rows = STUDENT_ACCOUNTS.filter((s) =>
    `${s.name} ${s.email} ${s.campus}`.toLowerCase().includes(q.trim().toLowerCase()),
  );
  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-3 px-4 pb-10" keyboardShouldPersistTaps="handled">
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
      <Text className="text-xs text-muted-foreground">
        {rows.length} of {STUDENT_ACCOUNTS.length} registered accounts
      </Text>
      {rows.map((s) => (
        <Card key={s.id} className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
            <Text className="text-xs font-extrabold text-primary">
              {s.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-foreground">{s.name}</Text>
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              {s.email} · {s.campus}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-sm font-extrabold text-primary">{s.swipes}</Text>
            <Text className="text-[11px] text-muted-foreground">{s.saved} saved</Text>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}
