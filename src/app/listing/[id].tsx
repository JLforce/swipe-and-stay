import { Linking, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ModalHeader } from "../../components/AppHeader";
import { Btn, Card, Icon, Meter, Photo, SectionTitle, Tag } from "../../components/kit";
import { colors } from "../../constants/brand";
import { SAFETY_CHECKLIST } from "../../data/mockData";
import { peso } from "../../lib/format";
import { commuteMinutes } from "../../lib/geo";
import { distanceKm, matchScore } from "../../lib/matching";
import { useApp } from "../../lib/store";

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { listings, prefs, weights, likedIds, like, unlike, flash } = useApp();
  const l = listings.find((x) => x.id === id);

  if (!l) {
    return (
      <View className="flex-1 bg-background">
        <ModalHeader title="Listing" onClose={() => router.back()} />
        <Text className="p-5 text-sm text-muted-foreground">This listing is no longer available.</Text>
      </View>
    );
  }

  const km = distanceKm(l, prefs);
  const mins = commuteMinutes(km);
  const liked = likedIds.includes(l.id);

  return (
    <View className="flex-1 bg-background">
      <ModalHeader title={l.title} onClose={() => router.back()} />
      <ScrollView contentContainerClassName="gap-5 p-5 pb-12">
        <Photo gradient={l.photo} className="h-48 w-full rounded-3xl" label="Photo placeholder" />
        {l.gallery.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {l.gallery.map((g, i) => (
              <Photo key={i} gradient={g} className="h-16 w-24 rounded-2xl" />
            ))}
          </ScrollView>
        ) : null}

        <View className="gap-2">
          <View className="flex-row flex-wrap gap-2">
            <Tag tone="primary">{l.type}</Tag>
            <Tag tone="accent">{`${matchScore(l, prefs, weights)}% match`}</Tag>
            <Tag>{`${l.slotsLeft} slot${l.slotsLeft > 1 ? "s" : ""} left`}</Tag>
            {!l.active ? <Tag tone="danger">Unavailable</Tag> : null}
          </View>
          <Text className="text-xl font-extrabold text-foreground">{l.title}</Text>
          <View className="flex-row items-center gap-1">
            <Icon name="location-outline" size={14} color={colors.mutedForeground} />
            <Text className="flex-1 text-sm text-muted-foreground">{l.area}</Text>
          </View>
          <Text className="text-2xl font-extrabold text-primary">
            {peso(l.price)} <Text className="text-sm font-semibold text-muted-foreground">/ month</Text>
          </Text>
          <Text className="text-sm leading-5 text-foreground/80">{l.description}</Text>
        </View>

        <Card className="gap-3">
          <Text className="text-sm font-bold text-foreground">
            {km.toFixed(1)} km from {prefs.campus.short}
          </Text>
          <View className="flex-row gap-2">
            {[
              { m: "Walk", v: mins.walk },
              { m: "Bike", v: mins.bike },
              { m: "Transit", v: mins.transit },
            ].map((r) => (
              <View key={r.m} className="flex-1 items-center rounded-2xl bg-secondary py-2">
                <Text className="text-sm font-bold text-secondary-foreground">{r.v} min</Text>
                <Text className="text-xs text-muted-foreground">{r.m}</Text>
              </View>
            ))}
          </View>
          <Text className="text-[11px] text-muted-foreground">Straight-line distance (Haversine). Travel times are estimates.</Text>
        </Card>

        <View>
          <SectionTitle>Amenities</SectionTitle>
          <View className="flex-row flex-wrap gap-2">
            {l.amenities.map((a) => (
              <Tag key={a}>{a}</Tag>
            ))}
          </View>
        </View>

        <Card className="gap-2">
          <View className="flex-row items-center gap-2">
            <Icon name="shield-checkmark-outline" size={16} color={colors.primary} />
            <Text className="text-sm font-bold text-foreground">Safety notes · {l.safety.score}/100</Text>
          </View>
          <Meter value={l.safety.score} />
          {l.safety.notes.map((n) => (
            <Text key={n} className="text-sm text-foreground/80">
              • {n}
            </Text>
          ))}
        </Card>

        <Card className="gap-3">
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary">
              <Text className="text-sm font-extrabold text-primary-foreground">{l.landlord.name.slice(0, 1) || "?"}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-foreground">{l.landlord.name || "Landlord"}</Text>
              <Text className="text-xs text-muted-foreground">Replies {l.landlord.responseTime}</Text>
            </View>
            {l.landlord.verified ? <Tag tone="primary" icon="checkmark-circle">Verified</Tag> : <Tag tone="danger" icon="warning">Unverified</Tag>}
          </View>
          {liked ? (
            <View className="gap-2">
              <View className="flex-row gap-2">
                <Btn variant="soft" icon="call-outline" label="Call" className="flex-1" onPress={() => Linking.openURL(`tel:${l.landlord.phone.replace(/\s/g, "")}`)} />
                <Btn variant="soft" icon="mail-outline" label="Email" className="flex-1" onPress={() => Linking.openURL(`mailto:${l.landlord.email}`)} />
              </View>
              <Text className="text-xs text-muted-foreground">
                {l.landlord.phone} · {l.landlord.email}
              </Text>
            </View>
          ) : (
            <Text className="text-xs text-muted-foreground">Save this listing to see the landlord&apos;s contact details.</Text>
          )}
        </Card>

        <Card className="gap-2 bg-accent/10">
          <Text className="text-sm font-extrabold text-foreground">Before you pay anything</Text>
          {SAFETY_CHECKLIST.map((t) => (
            <Text key={t} className="text-sm text-foreground/85">
              • {t}
            </Text>
          ))}
        </Card>

        <Btn
          variant={liked ? "outline" : "primary"}
          icon={liked ? "heart-dislike-outline" : "heart"}
          label={liked ? "Remove from saved" : "Save this listing"}
          onPress={() => {
            if (liked) {
              unlike(l.id);
              flash("Removed from Saved");
            } else {
              like(l.id);
              flash("Added to Saved");
            }
          }}
        />
      </ScrollView>
    </View>
  );
}
