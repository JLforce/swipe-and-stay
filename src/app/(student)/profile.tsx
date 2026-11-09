import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Btn, Card, Icon, Meter, Row, SectionTitle, Tag } from "../../components/kit";
import { colors } from "../../constants/brand";
import { SAFETY_CHECKLIST } from "../../data/mockData";
import { peso } from "../../lib/format";
import type { Factor } from "../../lib/matching";
import { useApp } from "../../lib/store";

const FACTOR_LABEL: Record<Factor, string> = { price: "Price", distance: "Distance", amenities: "Amenities", type: "Housing type" };

export default function Profile() {
  const router = useRouter();
  const { account, prefs, weights, signOut, swipes, likedIds, unreadCount } = useApp();

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 px-4 pb-10">
      <Card className="flex-row items-center gap-3">
        <View className="h-14 w-14 items-center justify-center rounded-3xl bg-primary">
          <Text className="text-lg font-extrabold text-primary-foreground">{account?.name.slice(0, 1)}</Text>
        </View>
        <View className="flex-1 gap-1">
          <Text className="text-base font-extrabold text-foreground">{account?.name}</Text>
          <View className="flex-row flex-wrap gap-1.5">
            <Tag tone="primary">{prefs.campus.short}</Tag>
            <Tag tone="accent">{`${swipes.length} swipes · ${likedIds.length} saved`}</Tag>
          </View>
        </View>
      </Card>

      <Card className="gap-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Icon name="sparkles" size={16} color={colors.primary} />
            <Text className="text-sm font-extrabold text-foreground">Your preferences</Text>
          </View>
          <Btn variant="soft" label="Edit" className="px-4 py-2" onPress={() => router.push("/preferences")} />
        </View>
        <Text className="text-sm text-foreground">
          {peso(prefs.budgetMin)} – {peso(prefs.budgetMax)} per month · {prefs.housingType === "Any" ? "any housing type" : prefs.housingType} ·{" "}
          {prefs.roommate === "any" ? "no roommate preference" : prefs.roommate}
        </Text>
        {prefs.desiredAmenities.length > 0 ? (
          <View className="flex-row flex-wrap gap-1.5">
            {prefs.desiredAmenities.map((a) => (
              <Tag key={a} tone="primary">
                {a}
              </Tag>
            ))}
          </View>
        ) : null}
        <SectionTitle>What the matcher has learned</SectionTitle>
        {(Object.keys(weights) as Factor[]).map((f) => (
          <View key={f} className="gap-1">
            <View className="flex-row justify-between">
              <Text className="text-xs font-semibold text-foreground">{FACTOR_LABEL[f]}</Text>
              <Text className="text-xs font-bold text-primary">{Math.round(weights[f] * 100)}%</Text>
            </View>
            <Meter value={weights[f] * 100} />
          </View>
        ))}
      </Card>

      <Card className="divide-y divide-border p-0">
        <Row icon="document-text-outline" label="Lease review" hint="Paste a lease for a plain-language summary" onPress={() => router.navigate("/lease")} />
        <Row icon="notifications-outline" label="Notifications" hint={unreadCount ? `${unreadCount} new` : "All caught up"} onPress={() => router.push("/notifications")} />
      </Card>

      <Card className="gap-2">
        <View className="flex-row items-center gap-2">
          <Icon name="shield-checkmark-outline" size={16} color={colors.primary} />
          <Text className="text-sm font-extrabold text-foreground">Safety checklist</Text>
        </View>
        {SAFETY_CHECKLIST.map((t) => (
          <Text key={t} className="text-sm text-foreground">
            • {t}
          </Text>
        ))}
      </Card>

      <Btn
        variant="outline"
        icon="log-out-outline"
        label="Sign out"
        onPress={() => {
          signOut();
          router.replace("/login");
        }}
      />
    </ScrollView>
  );
}
