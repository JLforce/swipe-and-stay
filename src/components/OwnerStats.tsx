import { Text, View } from "react-native";
import { colors } from "../constants/brand";
import { useOwner } from "../lib/owner";
import { Card, Icon } from "./kit";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="w-[48.5%] p-3">
      <Text className="text-lg font-extrabold leading-none text-primary">{value}</Text>
      <Text className="mt-1 text-[11px] font-semibold text-muted-foreground" numberOfLines={1}>
        {label}
      </Text>
    </Card>
  );
}

/** The four numbers at the top of the owner dashboard. */
export function OwnerStatsGrid() {
  const { stats, error } = useOwner();
  return (
    <View className="gap-2">
      <View className="flex-row flex-wrap justify-between gap-y-2">
        <Stat label="Active listings" value={`${stats.activeListings}/${stats.totalListings}`} />
        <Stat label="Interested students" value={`${stats.interestedStudents}`} />
        <Stat label="Swipes on your places" value={`${stats.swipes}`} />
        <Stat label="New inquiries" value={`${stats.newInquiries}`} />
      </View>
      {error ? (
        <Text className="rounded-2xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function OwnerTip() {
  return (
    <Card className="bg-primary/5">
      <View className="flex-row items-center gap-2">
        <Icon name="sparkles-outline" size={16} color={colors.primary} />
        <Text className="text-sm font-extrabold text-primary">Tip</Text>
      </View>
      <Text className="mt-1 text-sm text-foreground/80">
        Add clear photos and an up-to-date phone or email so students can trust and reach you.
      </Text>
    </Card>
  );
}
