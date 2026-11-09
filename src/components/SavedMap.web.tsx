// Web fallback: the interactive map only exists in the mobile app.
import { Pressable, Text, View } from "react-native";
import type { Campus } from "../constants/housing";
import { peso } from "../lib/format";
import type { SavedMapItem } from "./SavedMap";

export function SavedMap({
  campus,
  items,
  onOpen,
}: {
  campus: Campus;
  items: SavedMapItem[];
  onOpen: (id: string) => void;
}) {
  return (
    <View className="gap-2 rounded-3xl border border-border bg-card p-4">
      <Text className="text-sm font-extrabold text-foreground">Map view is available in the mobile app</Text>
      <Text className="text-xs text-muted-foreground">Saved places, measured to {campus.short}:</Text>
      {items.map(({ l, km }) => (
        <Pressable key={l.id} onPress={() => onOpen(l.id)} className="py-1 active:opacity-70">
          <Text className="text-sm text-foreground">
            {l.title} · {peso(l.price)} · {km.toFixed(1)} km
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
