import { ScrollView, Text, View } from "react-native";
import { Card, SectionTitle } from "../../components/kit";
import { BASE_LIKES, STUDENT_ACCOUNTS, WEEKLY_SWIPES } from "../../data/mockData";
import { useApp } from "../../lib/store";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="w-[48%] p-3">
      <Text className="text-xl font-extrabold text-primary">{value}</Text>
      <Text className="mt-1 text-[11px] font-semibold text-muted-foreground">{label}</Text>
    </Card>
  );
}

export default function Overview() {
  const { listings, swipes, likedIds } = useApp();
  const active = listings.filter((l) => l.active).length;
  const baseSwipes = STUDENT_ACCOUNTS.reduce((s, x) => s + x.swipes, 0);
  const totalSwipes = baseSwipes + swipes.length;
  const totalLikes = Object.values(BASE_LIKES).reduce((s, n) => s + n, 0) + likedIds.length;
  const max = Math.max(...WEEKLY_SWIPES.map((d) => d.n));

  const mostLiked = listings
    .map((l) => ({ l, likes: (BASE_LIKES[l.id] ?? 0) + (likedIds.includes(l.id) ? 1 : 0) }))
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 3);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 px-4 pb-10">
      <View className="flex-row flex-wrap justify-between gap-y-3">
        <Stat label="Active listings" value={`${active}/${listings.length}`} />
        <Stat label="Registered students" value={`${STUDENT_ACCOUNTS.length}`} />
        <Stat label="Total likes" value={`${totalLikes}`} />
        <Stat label="Card views (swipes)" value={`${totalSwipes}`} />
      </View>

      <Card className="gap-3">
        <Text className="text-sm font-extrabold text-foreground">Swipes this week</Text>
        <View className="h-28 flex-row items-end justify-between gap-2">
          {WEEKLY_SWIPES.map((d) => (
            <View key={d.day} className="flex-1 items-center gap-1">
              <View className="w-full rounded-t-xl bg-primary" style={{ height: Math.max(8, (d.n / max) * 90) }} />
              <Text className="text-[10px] text-muted-foreground">{d.day}</Text>
            </View>
          ))}
        </View>
        <Text className="text-[11px] text-muted-foreground">Sample data. Real counts come from the swipes table.</Text>
      </Card>

      <View>
        <SectionTitle>Most liked</SectionTitle>
        <Card className="gap-3">
          {mostLiked.map(({ l, likes }, i) => (
            <View key={l.id} className="flex-row items-center gap-3">
              <View className="h-7 w-7 items-center justify-center rounded-full bg-secondary">
                <Text className="text-xs font-extrabold text-primary">{i + 1}</Text>
              </View>
              <Text className="flex-1 text-sm font-semibold text-foreground" numberOfLines={1}>
                {l.title}
              </Text>
              <Text className="text-sm font-bold text-muted-foreground">♡ {likes}</Text>
            </View>
          ))}
        </Card>
      </View>
    </ScrollView>
  );
}
