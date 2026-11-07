import { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Btn, Card, Chip, Icon, Meter } from "../../components/kit";
import { SwipeDeck, type SwipeDeckHandle } from "../../components/SwipeDeck";
import { colors } from "../../constants/brand";
import { cn } from "../../lib/cn";
import { rankListings, type Factor } from "../../lib/matching";
import { useApp } from "../../lib/store";

const DISTANCES: { label: string; km?: number }[] = [
  { label: "Any distance" },
  { label: "≤ 0.5 km", km: 0.5 },
  { label: "≤ 1 km", km: 1 },
  { label: "≤ 2 km", km: 2 },
  { label: "≤ 5 km", km: 5 },
];
const FACTOR_LABEL: Record<Factor, string> = { price: "Price", distance: "Distance", amenities: "Amenities", type: "Type" };

export default function Discover() {
  const router = useRouter();
  const { listings, swipes, prefs, weights, swipe, undoSwipe, resetSwipes, flash } = useApp();
  const [maxKm, setMaxKm] = useState<number | undefined>(undefined);
  const deckRef = useRef<SwipeDeckHandle>(null);

  const deck = useMemo(
    () =>
      rankListings(
        listings,
        swipes.map((s) => s.listingId),
        prefs,
        weights,
        maxKm,
      ),
    [listings, swipes, prefs, weights, maxKm],
  );
  const current = deck[0];
  const next = deck[1];

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 px-4 pb-8">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-4">
        {DISTANCES.map((d) => (
          <Chip key={d.label} label={d.label} selected={maxKm === d.km} onPress={() => setMaxKm(d.km)} />
        ))}
      </ScrollView>

      {current ? (
        <>
          <SwipeDeck
            key={current.listing.id}
            ref={deckRef}
            current={current}
            next={next}
            prefs={prefs}
            weights={weights}
            onSwipe={(dir, item) => {
              swipe(item.listing, dir);
              if (dir === "right") flash("Added to Saved");
            }}
            onOpen={(item) => router.push({ pathname: "/listing/[id]", params: { id: item.listing.id } })}
          />
          <View className="flex-row items-center justify-center gap-5">
            <Pressable
              onPress={() => deckRef.current?.swipe("left")}
              accessibilityLabel="Pass"
              className="h-14 w-14 items-center justify-center rounded-full border border-border bg-card active:opacity-70"
            >
              <Icon name="close" size={26} color={colors.destructive} />
            </Pressable>
            <Pressable
              onPress={undoSwipe}
              disabled={swipes.length === 0}
              accessibilityLabel="Undo"
              className={cn("h-12 w-12 items-center justify-center rounded-full border border-border bg-card active:opacity-70", swipes.length === 0 && "opacity-40")}
            >
              <Icon name="arrow-undo" size={20} color={colors.mutedForeground} />
            </Pressable>
            <Pressable
              onPress={() => deckRef.current?.swipe("right")}
              accessibilityLabel="Like"
              className="h-16 w-16 items-center justify-center rounded-full bg-primary active:opacity-80"
            >
              <Icon name="heart" size={28} color={colors.primaryForeground} />
            </Pressable>
          </View>
          <Btn
            variant="outline"
            icon="information-circle-outline"
            label="Why am I seeing this?"
            onPress={() => router.push({ pathname: "/match/[id]", params: { id: current.listing.id } })}
          />
        </>
      ) : (
        <Card className="items-center gap-3 py-10">
          <Icon name="checkmark-circle-outline" size={40} color={colors.primary} />
          <Text className="text-lg font-extrabold text-foreground">You&apos;re all caught up</Text>
          <Text className="text-center text-sm text-muted-foreground">
            No more listings{maxKm ? " in that distance" : ""}. Try a wider distance or start over.
          </Text>
          <View className="flex-row gap-2">
            {maxKm ? <Btn variant="soft" label="Any distance" onPress={() => setMaxKm(undefined)} /> : null}
            <Btn label="Start over" icon="refresh" onPress={resetSwipes} />
          </View>
        </Card>
      )}

      <Card className="gap-3 bg-primary/5">
        <View className="flex-row items-center gap-2">
          <Icon name="sparkles" size={16} color={colors.primary} />
          <Text className="text-sm font-extrabold text-primary">Adaptive matching</Text>
        </View>
        <Text className="text-xs text-muted-foreground">
          {swipes.length === 0
            ? "Swipe a few cards. Your deck re-ranks after every swipe."
            : `Re-ranked after ${swipes.length} swipe${swipes.length === 1 ? "" : "s"}. What matters most to you right now:`}
        </Text>
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
    </ScrollView>
  );
}
