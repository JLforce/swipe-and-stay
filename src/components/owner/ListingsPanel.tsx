import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { colors } from "../../constants/brand";
import type { Listing } from "../../data/mockData";
import { peso } from "../../lib/format";
import { useOwner } from "../../lib/owner";
import { useApp } from "../../lib/store";
import { Card, Icon, Photo, Tag } from "../kit";
import { OwnerListingFormModal } from "../OwnerListingForm";

function Pill({
  label,
  icon,
  filled,
  disabled,
  onPress,
}: {
  label: string;
  icon: "pencil" | "eye-outline" | "eye-off-outline";
  filled?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 active:opacity-80 ${
        filled ? "bg-primary" : "border border-border bg-transparent"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <Icon name={icon} size={14} color={filled ? colors.primaryForeground : colors.foreground} />
      <Text className={`text-[11px] font-bold ${filled ? "text-primary-foreground" : "text-foreground/80"}`}>{label}</Text>
    </Pressable>
  );
}

export function ListingsPanel() {
  const { account, flash } = useApp();
  const { listings, loading, saveListing, setActive, removeListing } = useOwner();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [form, setForm] = useState<{ open: boolean; listing: Listing | null; key: number }>({
    open: false,
    listing: null,
    key: 0,
  });

  if (!account) return null;

  async function toggle(l: Listing) {
    setBusyId(l.id);
    try {
      await setActive(l.id, !l.active);
      flash(l.active ? "Listing deactivated" : "Listing is live again");
    } catch (e) {
      Alert.alert("Could not update", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  function confirmToggle(l: Listing) {
    if (!l.active) return void toggle(l);
    Alert.alert("Deactivate listing?", `${l.title} will be hidden from students. Chats you already have stay open.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Deactivate", style: "destructive", onPress: () => void toggle(l) },
    ]);
  }

  function confirmDelete(l: Listing) {
    Alert.alert("Delete listing?", `${l.title} and its chats will be removed for good. To only hide it, use Deactivate.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          removeListing(l.id)
            .then(() => {
              flash("Listing deleted");
              setForm((f) => ({ ...f, open: false }));
            })
            .catch((e: unknown) => Alert.alert("Could not delete", e instanceof Error ? e.message : "Please try again."));
        },
      },
    ]);
  }

  return (
    <View className="gap-3">
      <Pressable
        onPress={() => setForm({ open: true, listing: null, key: Date.now() })}
        className="flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3 active:opacity-70"
      >
        <Icon name="add" size={16} />
        <Text className="text-xs font-bold text-foreground/70">Add a new listing</Text>
      </Pressable>

      {loading ? <ActivityIndicator color={colors.primary} /> : null}

      {listings.map((l) => (
        <Card key={l.id} className="flex-row items-center gap-3">
          <Photo gradient={l.photo} uri={l.photoUrls?.[0]} className="h-16 w-16 rounded-2xl" />
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
              {l.title}
            </Text>
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              {l.area}
            </Text>
            <View className="mt-1 flex-row flex-wrap items-center gap-1.5">
              <Tag tone="primary">{`${peso(l.price)}/mo`}</Tag>
              <Tag>{l.type}</Tag>
              <Tag tone={l.active ? "accent" : "danger"}>{l.active ? "Live" : "Inactive"}</Tag>
            </View>
            <View className="mt-2 flex-row gap-2">
              <Pill
                filled
                icon="pencil"
                label="Edit"
                disabled={busyId === l.id}
                onPress={() => setForm({ open: true, listing: l, key: Date.now() })}
              />
              <Pill
                icon={l.active ? "eye-off-outline" : "eye-outline"}
                label={l.active ? "Deactivate" : "Activate"}
                disabled={busyId === l.id}
                onPress={() => confirmToggle(l)}
              />
            </View>
          </View>
        </Card>
      ))}

      {!loading && listings.length === 0 ? (
        <Text className="px-1 text-sm text-muted-foreground">You haven&apos;t posted a place yet.</Text>
      ) : null}

      {form.open ? (
        <OwnerListingFormModal
          key={form.key}
          visible
          ownerId={account.id}
          listing={form.listing}
          defaults={{ landlordName: account.name, landlordEmail: account.email }}
          onClose={() => setForm((f) => ({ ...f, open: false }))}
          onDelete={form.listing ? () => confirmDelete(form.listing!) : undefined}
          onSave={async (draft) => {
            await saveListing(draft, form.listing?.id);
            flash(form.listing ? "Changes saved" : draft.isActive ? "Listing posted" : "Draft saved");
            setForm((f) => ({ ...f, open: false }));
          }}
        />
      ) : null}
    </View>
  );
}
