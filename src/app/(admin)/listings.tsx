import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Btn, Card, Chip, Photo, Tag } from "../../components/kit";
import { ListingFormModal } from "../../components/ListingForm";
import type { Listing } from "../../data/mockData";
import { peso } from "../../lib/format";
import { useApp } from "../../lib/store";

type Filter = "all" | "active" | "inactive";

export default function AdminListings() {
  const { listings, upsertListing, toggleActive, flash } = useApp();
  const [filter, setFilter] = useState<Filter>("all");
  const [form, setForm] = useState<{ open: boolean; listing: Listing | null; key: number }>({ open: false, listing: null, key: 0 });

  const rows = listings.filter((l) => (filter === "all" ? true : filter === "active" ? l.active : !l.active));

  function confirmToggle(l: Listing) {
    if (!l.active) {
      toggleActive(l.id);
      flash("Listing is live again");
      return;
    }
    Alert.alert("Deactivate listing?", `${l.title} will be hidden from students. Students who saved it will be notified.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Deactivate",
        style: "destructive",
        onPress: () => {
          toggleActive(l.id);
          flash("Listing deactivated");
        },
      },
    ]);
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-3 px-4 pb-10">
        <View className="flex-row items-center gap-2">
          {(["all", "active", "inactive"] as Filter[]).map((f) => (
            <Chip key={f} label={f[0]!.toUpperCase() + f.slice(1)} selected={filter === f} onPress={() => setFilter(f)} />
          ))}
        </View>
        <Btn icon="add" label="Add a new listing" onPress={() => setForm({ open: true, listing: null, key: Date.now() })} />

        {rows.map((l) => (
          <Card key={l.id} className="flex-row gap-3 p-3">
            <Photo gradient={l.photo} className="h-16 w-16 rounded-2xl" />
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
                <Tag tone={l.active ? "accent" : "danger"}>{l.active ? "Live" : "Inactive"}</Tag>
              </View>
              <View className="mt-1 flex-row gap-2">
                <Btn label="Edit" icon="pencil" className="px-3 py-2" onPress={() => setForm({ open: true, listing: l, key: Date.now() })} />
                <Btn
                  variant="outline"
                  className="px-3 py-2"
                  icon={l.active ? "eye-off-outline" : "eye-outline"}
                  label={l.active ? "Deactivate" : "Activate"}
                  onPress={() => confirmToggle(l)}
                />
              </View>
            </View>
          </Card>
        ))}
        {rows.length === 0 ? <Text className="px-1 text-sm text-muted-foreground">No listings here.</Text> : null}
      </ScrollView>

      {form.open ? (
        <ListingFormModal
          key={form.key}
          visible
          listing={form.listing}
          onClose={() => setForm({ ...form, open: false })}
          onSave={(l) => {
            upsertListing(l);
            flash(form.listing ? "Listing updated" : "Listing added");
            setForm({ ...form, open: false });
          }}
        />
      ) : null}
    </View>
  );
}
