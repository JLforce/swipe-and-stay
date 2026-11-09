import { Pressable, Text, View } from "react-native";
import { colors } from "../constants/brand";
import { commuteMinutes } from "../lib/geo";
import { peso } from "../lib/format";
import { caption, type Prefs, type Ranked, type Weights } from "../lib/matching";
import { Icon, Photo, Tag } from "./kit";

export function ListingCard({
  item,
  prefs,
  weights,
  onPress,
}: {
  item: Ranked;
  prefs: Prefs;
  weights: Weights;
  onPress: () => void;
}) {
  const { listing: l, score, km } = item;
  const mins = commuteMinutes(km);
  return (
    <Pressable onPress={onPress} className="h-full overflow-hidden rounded-[32px] border border-border bg-card">
      <Photo gradient={l.photo} className="h-56 w-full" label="Property photo placeholder" />
      <View className="absolute right-3 top-3 rounded-full bg-background/90 px-3 py-1.5">
        <Text className="text-xs font-extrabold text-primary">{score}% match</Text>
      </View>
      <View className="gap-2 p-4">
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-1">
            <Text className="text-lg font-extrabold text-foreground" numberOfLines={1}>
              {l.title}
            </Text>
            <View className="mt-0.5 flex-row items-center gap-1">
              <Icon name="location-outline" size={12} color={colors.mutedForeground} />
              <Text className="flex-1 text-xs text-muted-foreground" numberOfLines={1}>
                {l.area}
              </Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-base font-extrabold text-primary">{peso(l.price)}</Text>
            <Text className="text-[10px] font-semibold text-muted-foreground">per month</Text>
          </View>
        </View>
        <View className="flex-row flex-wrap gap-2">
          <Tag tone="primary">{l.type}</Tag>
          <Tag tone="accent" icon="walk">{`${km.toFixed(1)} km · ${mins.walk} min walk`}</Tag>
          {l.amenities.slice(0, 2).map((a) => (
            <Tag key={a}>{a}</Tag>
          ))}
        </View>
        <Text className="text-xs italic text-muted-foreground" numberOfLines={2}>
          {caption(l, prefs, weights)}
        </Text>
      </View>
    </Pressable>
  );
}
