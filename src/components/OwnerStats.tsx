import { Text, View } from "react-native";
import { useOwner } from "../lib/owner";
import { Card } from "./kit";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="w-[48%] p-3">
      <Text className="text-xl font-extrabold text-primary">{value}</Text>
      <Text className="mt-1 text-[11px] font-semibold text-muted-foreground">{label}</Text>
    </Card>
  );
}

/** The four numbers at the top of every owner screen. */
export function OwnerStatsGrid() {
  const { stats, error } = useOwner();
  return (
    <View className="gap-2">
      <View className="flex-row flex-wrap justify-between gap-y-3">
        <Stat label="Active listings" value={`${stats.activeListings}/${stats.totalListings}`} />
        <Stat label="Students who saved your places" value={`${stats.interestedStudents}`} />
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
