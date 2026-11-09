import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Btn, Card, Chip, Photo, Tag } from "../../components/kit";
import { ListingFormModal } from "../../components/ListingForm";
import { colors } from "../../constants/brand";
import type { Listing } from "../../data/mockData";
import { peso } from "../../lib/format";
import {
  createListing,
  fetchMyListings,
  listingToInsert,
  listingToUpdate,
  rowToListing,
  setListingActive,
  updateListing,
} from "../../lib/listings";
import { useApp } from "../../lib/store";

type Filter = "all" | "active" | "inactive";

// Alert.alert with buttons does nothing on web, so use the browser dialogs there.
function confirmAction(
  title: string,
  message: string,
  confirmLabel: string,
): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        {
          text: confirmLabel,
          style: "destructive",
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

function showMessage(title: string, message: string) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

export default function AdminListings() {
  const { account, flash } = useApp();
  const accountId = account?.id;
  const [rows, setRows] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [form, setForm] = useState<{
    open: boolean;
    listing: Listing | null;
    key: number;
  }>({ open: false, listing: null, key: 0 });

  // Load this admin's own listings from Supabase.
  useEffect(() => {
    if (!accountId) return;
    let active = true;

    fetchMyListings(accountId)
      .then((data) => {
        if (!active) return;
        setRows(data.map(rowToListing));
        setLoadError(null);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (!active) return;
        setLoadError(
          e instanceof Error ? e.message : "Could not load your listings.",
        );
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accountId]);

  const shown = rows.filter((l) =>
    filter === "all" ? true : filter === "active" ? l.active : !l.active,
  );

  async function save(l: Listing) {
    if (saving) return;
    setSaving(true);
    try {
      if (form.listing) {
        const row = await updateListing(form.listing.id, listingToUpdate(l));
        const saved = rowToListing(row);
        setRows((cur) => cur.map((x) => (x.id === saved.id ? saved : x)));
        flash("Listing updated");
      } else {
        // New listings start as drafts; the admin activates them when ready.
        const row = await createListing(listingToInsert(l, false));
        setRows((cur) => [rowToListing(row), ...cur]);
        flash("Listing added as a draft");
      }
      setForm((f) => ({ ...f, open: false }));
    } catch (e) {
      showMessage(
        "Could not save the listing",
        e instanceof Error ? e.message : "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggle(l: Listing) {
    if (busyId) return;

    if (l.active) {
      const ok = await confirmAction(
        "Deactivate listing?",
        `${l.title} will be hidden from students.`,
        "Deactivate",
      );
      if (!ok) return;
    }

    setBusyId(l.id);
    try {
      const row = await setListingActive(l.id, !l.active);
      const saved = rowToListing(row);
      setRows((cur) => cur.map((x) => (x.id === saved.id ? saved : x)));
      flash(saved.active ? "Listing is live" : "Listing deactivated");
    } catch (e) {
      showMessage(
        "Could not change the listing",
        e instanceof Error ? e.message : "Please try again.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-3 px-4 pb-10">
        <View className="flex-row items-center gap-2">
          {(["all", "active", "inactive"] as Filter[]).map((f) => (
            <Chip
              key={f}
              label={f[0]!.toUpperCase() + f.slice(1)}
              selected={filter === f}
              onPress={() => setFilter(f)}
            />
          ))}
        </View>
        <Btn
          icon="add"
          label="Add a new listing"
          onPress={() =>
            setForm({ open: true, listing: null, key: Date.now() })
          }
        />

        {loading ? (
          <View className="items-center py-6">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}

        {loadError ? (
          <Text className="rounded-2xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
            {loadError}
          </Text>
        ) : null}

        {shown.map((l) => (
          <Card key={l.id} className="flex-row gap-3 p-3">
            <Photo gradient={l.photo} className="h-16 w-16 rounded-2xl" />
            <View className="flex-1 gap-1">
              <Text
                className="text-sm font-bold text-foreground"
                numberOfLines={1}
              >
                {l.title}
              </Text>
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {l.area}
              </Text>
              <View className="flex-row flex-wrap gap-1.5">
                <Tag tone="primary">{`${peso(l.price)}/mo`}</Tag>
                <Tag>{l.type}</Tag>
                <Tag tone={l.active ? "accent" : "danger"}>
                  {l.active ? "Live" : "Inactive"}
                </Tag>
              </View>
              <View className="mt-1 flex-row gap-2">
                <Btn
                  label="Edit"
                  icon="pencil"
                  className="px-3 py-2"
                  disabled={busyId === l.id}
                  onPress={() =>
                    setForm({ open: true, listing: l, key: Date.now() })
                  }
                />
                <Btn
                  variant="outline"
                  className="px-3 py-2"
                  icon={l.active ? "eye-off-outline" : "eye-outline"}
                  label={l.active ? "Deactivate" : "Activate"}
                  disabled={busyId === l.id}
                  onPress={() => toggle(l)}
                />
              </View>
            </View>
          </Card>
        ))}

        {!loading && !loadError && shown.length === 0 ? (
          <Text className="px-1 text-sm text-muted-foreground">
            No listings here.
          </Text>
        ) : null}
      </ScrollView>

      {form.open ? (
        <ListingFormModal
          key={form.key}
          visible
          listing={form.listing}
          onClose={() => setForm((f) => ({ ...f, open: false }))}
          onSave={save}
        />
      ) : null}
    </View>
  );
}
