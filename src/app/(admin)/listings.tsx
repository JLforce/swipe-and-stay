import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { Btn, Card, Chip, Icon, Photo, Tag } from "../../components/kit";
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

function SummaryCard({
  label,
  value,
  icon,
  tone = "primary",
}: {
  label: string;
  value: number;
  icon: React.ComponentProps<typeof Icon>["name"];
  tone?: "primary" | "accent" | "muted";
}) {
  const iconColor =
    tone === "accent"
      ? colors.accent
      : tone === "muted"
        ? colors.mutedForeground
        : colors.primary;

  const iconBackground =
    tone === "accent"
      ? "bg-accent/10"
      : tone === "muted"
        ? "bg-secondary"
        : "bg-primary/10";

  return (
    <View className="min-w-0 flex-1 rounded-2xl border border-border bg-card p-3">
      <View
        className={`mb-3 h-9 w-9 items-center justify-center rounded-xl ${iconBackground}`}
      >
        <Icon name={icon} size={18} color={iconColor} />
      </View>

      <Text className="text-2xl font-extrabold text-foreground">{value}</Text>

      <Text className="mt-1 text-[11px] font-semibold text-muted-foreground">
        {label}
      </Text>
    </View>
  );
}

function ListingCard({
  listing,
  busy,
  onEdit,
  onToggle,
}: {
  listing: Listing;
  busy: boolean;
  onEdit: () => void;
  onToggle: () => void;
}) {
  return (
    <Card className="gap-3 p-3">
      <View className="flex-row gap-3">
        <Photo
          gradient={listing.photo}
          className="h-[104px] w-[104px] rounded-2xl"
        />

        <View className="min-w-0 flex-1 gap-1">
          <View className="flex-row items-start justify-between gap-2">
            <Text
              className="flex-1 text-sm font-extrabold text-foreground"
              numberOfLines={2}
            >
              {listing.title}
            </Text>

            <Tag tone={listing.active ? "primary" : "danger"}>
              {listing.active ? "Live" : "Inactive"}
            </Tag>
          </View>

          <View className="flex-row items-center gap-1">
            <Icon
              name="location-outline"
              size={13}
              color={colors.mutedForeground}
            />
            <Text
              className="flex-1 text-xs text-muted-foreground"
              numberOfLines={2}
            >
              {listing.area}
            </Text>
          </View>

          <Text className="mt-1 text-lg font-extrabold text-primary">
            {peso(listing.price)}
            <Text className="text-xs font-medium text-muted-foreground">
              {" "}
              / month
            </Text>
          </Text>

          <View className="mt-1 flex-row flex-wrap gap-1.5">
            <Tag>{listing.type}</Tag>
            <Tag tone="muted">
              {listing.occupancy === "shared" ? "Shared" : "Private"}
            </Tag>
          </View>
        </View>
      </View>

      <View className="h-px bg-border" />

      <View className="flex-row gap-2">
        <View className="flex-1">
          <Btn
            label="Edit listing"
            icon="create-outline"
            variant="outline"
            disabled={busy}
            className="py-3"
            onPress={onEdit}
          />
        </View>

        <View className="flex-1">
          <Btn
            label={listing.active ? "Deactivate" : "Activate"}
            icon={listing.active ? "eye-off-outline" : "eye-outline"}
            variant={listing.active ? "soft" : "primary"}
            disabled={busy}
            className="py-3"
            onPress={onToggle}
          />
        </View>
      </View>
    </Card>
  );
}

export default function AdminListings() {
  const { account, flash } = useApp();
  const accountId = account?.id;

  const [rows, setRows] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState<{
    open: boolean;
    listing: Listing | null;
    key: number;
  }>({
    open: false,
    listing: null,
    key: 0,
  });

  const loadListings = useCallback(
    async (isRefresh = false) => {
      if (!accountId) return;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const data = await fetchMyListings(accountId);

        setRows(data.map(rowToListing));
        setLoadError(null);
      } catch (e) {
        setLoadError(
          e instanceof Error ? e.message : "Could not load your listings.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accountId],
  );

  // Refresh whenever the Listings tab becomes active.
  useFocusEffect(
    useCallback(() => {
      void loadListings();
    }, [loadListings]),
  );

  const activeCount = rows.filter((listing) => listing.active).length;
  const inactiveCount = rows.length - activeCount;

  const filteredRows = rows.filter((listing) => {
    const matchesFilter =
      filter === "all"
        ? true
        : filter === "active"
          ? listing.active
          : !listing.active;

    const query = search.trim().toLowerCase();

    const matchesSearch =
      !query ||
      `${listing.title} ${listing.area} ${listing.type}`
        .toLowerCase()
        .includes(query);

    return matchesFilter && matchesSearch;
  });

  async function save(listing: Listing) {
    if (saving) return;

    setSaving(true);

    try {
      if (form.listing) {
        const row = await updateListing(
          form.listing.id,
          listingToUpdate(listing),
        );

        const saved = rowToListing(row);

        setRows((current) =>
          current.map((item) => (item.id === saved.id ? saved : item)),
        );

        flash("Listing updated");
      } else {
        const row = await createListing(listingToInsert(listing, false));

        setRows((current) => [rowToListing(row), ...current]);

        flash("Listing added as a draft");
      }

      setForm((current) => ({
        ...current,
        open: false,
      }));
    } catch (e) {
      showMessage(
        "Could not save the listing",
        e instanceof Error ? e.message : "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggle(listing: Listing) {
    if (busyId) return;

    if (listing.active) {
      const confirmed = await confirmAction(
        "Deactivate listing?",
        `${listing.title} will be hidden from students.`,
        "Deactivate",
      );

      if (!confirmed) return;
    }

    setBusyId(listing.id);

    try {
      const row = await setListingActive(listing.id, !listing.active);

      const saved = rowToListing(row);

      setRows((current) =>
        current.map((item) => (item.id === saved.id ? saved : item)),
      );

      flash(saved.active ? "Listing is now live" : "Listing deactivated");
    } catch (e) {
      showMessage(
        "Could not change listing status",
        e instanceof Error ? e.message : "Please try again.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadListings(true)}
            tintColor={colors.primary}
          />
        }
        contentContainerClassName="gap-4 px-4 pb-10 pt-3"
      >
        {/* Page introduction */}
        <View className="gap-1">
          <Text className="text-2xl font-extrabold text-foreground">
            Listing management
          </Text>

          <Text className="text-sm text-muted-foreground">
            Manage your properties and their availability.
          </Text>
        </View>

        {/* Listing summary */}
        <View className="flex-row gap-2">
          <SummaryCard
            label="Total listings"
            value={rows.length}
            icon="business-outline"
          />

          <SummaryCard
            label="Active"
            value={activeCount}
            icon="checkmark-circle-outline"
          />

          <SummaryCard
            label="Inactive"
            value={inactiveCount}
            icon="eye-off-outline"
            tone="accent"
          />
        </View>

        {/* Add listing */}
        <Btn
          label="Add new listing"
          icon="add"
          onPress={() =>
            setForm({
              open: true,
              listing: null,
              key: Date.now(),
            })
          }
        />

        {/* Search */}
        <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4">
          <Icon name="search" size={18} color={colors.mutedForeground} />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search property or location..."
            placeholderTextColor={colors.mutedForeground}
            className="min-w-0 flex-1 py-3.5 text-sm text-foreground"
            returnKeyType="search"
          />

          {search.length > 0 ? (
            <Icon
              name="close-circle"
              size={18}
              color={colors.mutedForeground}
            />
          ) : null}
        </View>

        {/* Filters */}
        <View className="gap-2">
          <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Filter listings
          </Text>

          <View className="flex-row flex-wrap gap-2">
            <Chip
              label={`All (${rows.length})`}
              selected={filter === "all"}
              onPress={() => setFilter("all")}
            />

            <Chip
              label={`Active (${activeCount})`}
              selected={filter === "active"}
              onPress={() => setFilter("active")}
            />

            <Chip
              label={`Inactive (${inactiveCount})`}
              selected={filter === "inactive"}
              onPress={() => setFilter("inactive")}
            />
          </View>
        </View>

        {/* Loading */}
        {loading ? (
          <View className="items-center gap-2 py-12">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-xs text-muted-foreground">
              Loading listings...
            </Text>
          </View>
        ) : null}

        {/* Error */}
        {loadError ? (
          <View className="gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
            <View className="flex-row items-center gap-2">
              <Icon
                name="alert-circle-outline"
                color={colors.destructive}
                size={18}
              />

              <Text className="flex-1 text-sm font-bold text-destructive">
                Unable to load listings
              </Text>
            </View>

            <Text className="text-xs text-muted-foreground">{loadError}</Text>

            <Btn
              label="Try again"
              icon="refresh"
              variant="outline"
              onPress={() => void loadListings()}
            />
          </View>
        ) : null}

        {/* Listings */}
        {!loading && !loadError ? (
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-extrabold text-foreground">
                {filter === "all"
                  ? "Your properties"
                  : filter === "active"
                    ? "Active properties"
                    : "Inactive properties"}
              </Text>

              <Text className="text-xs font-semibold text-muted-foreground">
                {filteredRows.length}{" "}
                {filteredRows.length === 1 ? "listing" : "listings"}
              </Text>
            </View>

            {filteredRows.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                busy={busyId === listing.id || busyId !== null}
                onEdit={() =>
                  setForm({
                    open: true,
                    listing,
                    key: Date.now(),
                  })
                }
                onToggle={() => void toggle(listing)}
              />
            ))}

            {filteredRows.length === 0 ? (
              <View className="items-center rounded-3xl border border-border bg-card px-6 py-12">
                <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                  <Icon
                    name={search.trim() ? "search-outline" : "business-outline"}
                    size={28}
                    color={colors.primary}
                  />
                </View>

                <Text className="text-base font-extrabold text-foreground">
                  {search.trim()
                    ? "No matching listings"
                    : filter === "active"
                      ? "No active listings"
                      : filter === "inactive"
                        ? "No inactive listings"
                        : "No listings yet"}
                </Text>

                <Text className="mt-2 text-center text-xs leading-5 text-muted-foreground">
                  {search.trim()
                    ? "Try another property name or location."
                    : "Add a property to start managing your housing listings."}
                </Text>

                {!search.trim() && filter === "all" ? (
                  <Btn
                    label="Add your first listing"
                    icon="add"
                    className="mt-5"
                    onPress={() =>
                      setForm({
                        open: true,
                        listing: null,
                        key: Date.now(),
                      })
                    }
                  />
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {/* Add / Edit modal */}
      {form.open ? (
        <ListingFormModal
          key={form.key}
          visible
          listing={form.listing}
          onClose={() =>
            setForm((current) => ({
              ...current,
              open: false,
            }))
          }
          onSave={save}
        />
      ) : null}
    </View>
  );
}
