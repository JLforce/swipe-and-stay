import { useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, View } from "react-native";
import { Btn, Card, Chip, Photo, Tag } from "../../components/kit";
import { OwnerListingFormModal } from "../../components/OwnerListingForm";
import { OwnerStatsGrid } from "../../components/OwnerStats";
import { colors } from "../../constants/brand";
import type { Listing } from "../../data/mockData";
import { peso } from "../../lib/format";
import { useOwner } from "../../lib/owner";
import { useApp } from "../../lib/store";

type Filter = "all" | "active" | "inactive";

export default function OwnerListings() {
  const { account, flash } = useApp();
  const { listings, loading, refresh, saveListing, setActive, removeListing } = useOwner();
  const [filter, setFilter] = useState<Filter>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [form, setForm] = useState<{ open: boolean; listing: Listing | null; key: number }>({
    open: false,
    listing: null,
    key: 0,
  });

  if (!account) return null;

  const rows = listings.filter((l) =>
    filter === "all" ? true : filter === "active" ? l.active : !l.active,
  );

  async function toggle(l: Listing) {
    setBusyId(l.id);
    try {
      await setActive(l.id, !l.active);
      flash(l.active ? "Listing hidden from students" : "Listing is live");
    } catch (e) {
      Alert.alert("Could not update", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  function confirmToggle(l: Listing) {
    if (!l.active) return void toggle(l);
    Alert.alert(
      "Deactivate listing?",
      `${l.title} will be hidden from students. Chats you already have stay open.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Deactivate", style: "destructive", onPress: () => void toggle(l) },
      ],
    );
  }

  function confirmDelete(l: Listing) {
    Alert.alert(
      "Delete listing?",
      `${l.title} and its chats will be removed for good. To only hide it, use Deactivate.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setBusyId(l.id);
            removeListing(l.id)
              .then(() => flash("Listing deleted"))
              .catch((e: unknown) =>
                Alert.alert("Could not delete", e instanceof Error ? e.message : "Please try again."),
              )
              .finally(() => setBusyId(null));
          },
        },
      ],
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerClassName="gap-3 px-4 pb-10"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.primary}
            onRefresh={async () => {
              setRefreshing(true);
              await refresh();
              setRefreshing(false);
            }}
          />
        }
      >
        <OwnerStatsGrid />
        <View className="flex-row items-center gap-2">
          {(["all", "active", "inactive"] as Filter[]).map((f) => (
            <Chip key={f} label={f[0]!.toUpperCase() + f.slice(1)} selected={filter === f} onPress={() => setFilter(f)} />
          ))}
        </View>
        <Btn icon="add" label="Post a rental" onPress={() => setForm({ open: true, listing: null, key: Date.now() })} />

        {loading ? <ActivityIndicator color={colors.primary} className="mt-4" /> : null}

        {rows.map((l) => (
          <Card key={l.id} className="flex-row gap-3 p-3">
            <Photo gradient={l.photo} uri={l.photoUrls?.[0]} className="h-16 w-16 rounded-2xl" />
            <View className="flex-1 gap-1">
              <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
                {l.title}
              </Text>
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {l.area}
              </Text>
              <View className="flex-row flex-wrap gap-1.5">
                <Tag tone="primary">{`${peso(l.price)}/mo`}</Tag>
                <Tag>{l.type}</Tag>
                <Tag tone={l.active ? "accent" : "danger"}>{l.active ? "Live" : "Draft / inactive"}</Tag>
              </View>
              <View className="mt-1 flex-row flex-wrap gap-2">
                <Btn label="Edit" icon="pencil" className="px-3 py-2" disabled={busyId === l.id} onPress={() => setForm({ open: true, listing: l, key: Date.now() })} />
                <Btn
                  variant="outline"
                  className="px-3 py-2"
                  icon={l.active ? "eye-off-outline" : "eye-outline"}
                  label={l.active ? "Deactivate" : "Activate"}
                  disabled={busyId === l.id}
                  onPress={() => confirmToggle(l)}
                />
                <Btn variant="danger" className="px-3 py-2" icon="trash-outline" label="Delete" disabled={busyId === l.id} onPress={() => confirmDelete(l)} />
              </View>
            </View>
          </Card>
        ))}
        {!loading && rows.length === 0 ? (
          <Text className="px-1 text-sm text-muted-foreground">
            {listings.length === 0
              ? "You have not posted a rental yet. Tap “Post a rental” to add your first one."
              : "No listings here."}
          </Text>
        ) : null}
      </ScrollView>

      {form.open ? (
        <OwnerListingFormModal
          key={form.key}
          visible
          ownerId={account.id}
          listing={form.listing}
          defaults={{ landlordName: account.name, landlordEmail: account.email }}
          onClose={() => setForm({ ...form, open: false })}
          onSave={async (draft) => {
            await saveListing(draft, form.listing?.id);
            flash(form.listing ? "Listing updated" : draft.isActive ? "Listing posted" : "Draft saved");
            setForm({ ...form, open: false });
          }}
        />
      ) : null}
    </View>
  );
}
