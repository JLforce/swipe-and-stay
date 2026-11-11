import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Card, Chip, Icon, Photo, Tag } from "../../components/kit";
import { SavedMap } from "../../components/SavedMap";
import { colors } from "../../constants/brand";
import { commuteMinutes } from "../../lib/geo";
import { peso } from "../../lib/format";
import { distanceKm } from "../../lib/matching";
import { useApp } from "../../lib/store";

export default function Saved() {
  const router = useRouter();
  const { listings, likedIds, prefs, unlike, flash } = useApp();
  const [view, setView] = useState<"list" | "map">("list");
  const [nearest, setNearest] = useState(false);

  const items = useMemo(() => {
    const rows = likedIds
      .map((id) => listings.find((l) => l.id === id))
      .filter((l): l is NonNullable<typeof l> => Boolean(l))
      .map((l) => ({ l, km: distanceKm(l, prefs) }));
    return nearest ? [...rows].sort((a, b) => a.km - b.km) : rows;
  }, [likedIds, listings, prefs, nearest]);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-3 px-4 pb-8">
      <View className="flex-row flex-wrap items-center gap-2">
        <Chip label="List" selected={view === "list"} onPress={() => setView("list")} />
        <Chip label="Map" selected={view === "map"} onPress={() => setView("map")} />
        <Chip label="Nearest first" selected={nearest} onPress={() => setNearest(!nearest)} />
      </View>
      <Text className="text-xs text-muted-foreground">
        {items.length} saved · distances measured to {prefs.campus.short}
      </Text>

      {items.length === 0 ? (
        <Card className="items-center gap-2 py-10">
          <Icon name="heart-outline" size={36} color={colors.mutedForeground} />
          <Text className="text-base font-extrabold text-foreground">Nothing saved yet</Text>
          <Text className="text-center text-sm text-muted-foreground">Swipe right on a listing in Discover and it shows up here.</Text>
        </Card>
      ) : view === "map" ? (
        <SavedMap
          campus={prefs.campus}
          items={items}
          onOpen={(id) => router.push({ pathname: "/listing/[id]", params: { id } })}
        />
      ) : (
        items.map(({ l, km }) => (
          <Card key={l.id} className="flex-row items-center gap-3 p-3">
            <Pressable onPress={() => router.push({ pathname: "/listing/[id]", params: { id: l.id } })}>
              <Photo gradient={l.photo} uri={l.photoUrls?.[0]} className="h-16 w-16 rounded-2xl" />
            </Pressable>
            <Pressable className="flex-1 gap-1" onPress={() => router.push({ pathname: "/listing/[id]", params: { id: l.id } })}>
              <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
                {l.title}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {peso(l.price)} · {l.type}
              </Text>
              <View className="flex-row gap-1.5">
                <Tag tone="accent" icon="walk">{`${km.toFixed(1)} km · ${commuteMinutes(km).walk} min`}</Tag>
                {!l.active ? <Tag tone="danger">Unavailable</Tag> : null}
              </View>
            </Pressable>
            <Pressable
              onPress={() => {
                unlike(l.id);
                flash("Removed from Saved");
              }}
              accessibilityLabel="Remove from saved"
              className="h-9 w-9 items-center justify-center rounded-full border border-border active:opacity-70"
            >
              <Icon name="trash-outline" size={16} color={colors.destructive} />
            </Pressable>
          </Card>
        ))
      )}
    </ScrollView>
  );
}
