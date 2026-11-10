import { useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { ListingReviewModal } from "../../components/admin/ListingReviewModal";
import { RejectListingModal } from "../../components/admin/RejectListingModal";
import { Btn, Card, Chip, Icon, Photo, Tag } from "../../components/kit";
import { colors } from "../../constants/brand";
import {
  ADMIN_LISTING_PREVIEW,
  type AdminListingPreview,
  type VerificationStatus,
} from "../../data/adminListingPreview";
import { peso } from "../../lib/format";

type Filter = "all" | VerificationStatus;

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

      <Text className="text-2xl font-extrabold text-foreground">
        {value}
      </Text>

      <Text className="mt-1 text-[11px] font-semibold text-muted-foreground">
        {label}
      </Text>
    </View>
  );
}

function VerificationTag({
  status,
}: {
  status: VerificationStatus;
}) {
  const config = {
    pending: { label: "Pending Review", tone: "accent" as const },
    verified: { label: "Verified", tone: "primary" as const },
    rejected: { label: "Rejected", tone: "danger" as const },
  };

  const item = config[status];

  return <Tag tone={item.tone}>{item.label}</Tag>;
}

function ListingCard({
  listing,
  onPress,
}: {
  listing: AdminListingPreview;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
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
                {listing.address}
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

        <View className="gap-2">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="text-xs text-muted-foreground">
              Submitted by
            </Text>
            <Text
              className="flex-1 text-right text-xs font-bold text-foreground"
              numberOfLines={1}
            >
              {listing.owner.name}
            </Text>
          </View>

          <View className="flex-row flex-wrap items-center gap-2">
            <VerificationTag status={listing.verificationStatus} />

            <Tag
              tone={
                listing.publicationStatus === "published"
                  ? "primary"
                  : "muted"
              }
            >
              {listing.publicationStatus === "published"
                ? "Published"
                : "Unpublished"}
            </Tag>
          </View>

          <View className="mt-1 flex-row items-center justify-end gap-1">
            <Text className="text-xs font-bold text-primary">
              Review listing
            </Text>
            <Icon
              name="chevron-forward"
              size={15}
              color={colors.primary}
            />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export default function AdminListings() {
  const [rows, setRows] = useState<AdminListingPreview[]>(
    ADMIN_LISTING_PREVIEW,
  );

  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const [selectedListing, setSelectedListing] =
    useState<AdminListingPreview | null>(null);

  const [rejectionListing, setRejectionListing] =
    useState<AdminListingPreview | null>(null);

  const totalCount = rows.length;
  const pendingCount = rows.filter(
    (listing) => listing.verificationStatus === "pending",
  ).length;
  const verifiedCount = rows.filter(
    (listing) => listing.verificationStatus === "verified",
  ).length;
  const rejectedCount = rows.filter(
    (listing) => listing.verificationStatus === "rejected",
  ).length;

  const filteredRows = rows.filter((listing) => {
    const matchesFilter =
      filter === "all" || listing.verificationStatus === filter;

    const query = search.trim().toLowerCase();

    const searchableText = [
      listing.title,
      listing.address,
      listing.owner.name,
      listing.owner.email,
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !query || searchableText.includes(query);

    return matchesFilter && matchesSearch;
  });

  function verifyListing(listing: AdminListingPreview) {
    if (listing.verificationStatus !== "pending") return;

    const updated: AdminListingPreview = {
      ...listing,
      verificationStatus: "verified",
      publicationStatus: "unpublished",
      rejectionReason: null,
    };

    setRows((current) =>
      current.map((item) =>
        item.id === listing.id ? updated : item,
      ),
    );

    setSelectedListing(updated);
  }

  function openRejection(listing: AdminListingPreview) {
    if (listing.verificationStatus !== "pending") return;

    setSelectedListing(null);
    setRejectionListing(listing);
  }

  function rejectListing(reason: string) {
    if (!rejectionListing || !reason.trim()) return;

    const updated: AdminListingPreview = {
      ...rejectionListing,
      verificationStatus: "rejected",
      publicationStatus: "unpublished",
      rejectionReason: reason.trim(),
    };

    setRows((current) =>
      current.map((item) =>
        item.id === updated.id ? updated : item,
      ),
    );

    setRejectionListing(null);
  }

  function togglePublication(listing: AdminListingPreview) {
    if (listing.verificationStatus !== "verified") return;

    const updated: AdminListingPreview = {
      ...listing,
      publicationStatus:
        listing.publicationStatus === "published"
          ? "unpublished"
          : "published",
    };

    setRows((current) =>
      current.map((item) =>
        item.id === updated.id ? updated : item,
      ),
    );

    setSelectedListing(updated);
  }

  const filterTitle =
    filter === "all"
      ? "All submissions"
      : filter === "pending"
        ? "Pending submissions"
        : filter === "verified"
          ? "Verified listings"
          : "Rejected listings";

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-4 px-4 pb-10 pt-3"
      >
        {/* Page introduction */}
        <View className="gap-1">
          <Text className="text-2xl font-extrabold text-foreground">
            Listing management
          </Text>

          <Text className="text-sm text-muted-foreground">
            Review and monitor property listings submitted by Owners.
          </Text>
        </View>

        {/* Listing summary */}
        <View className="flex-row gap-2">
          <SummaryCard
            label="Total listings"
            value={totalCount}
            icon="business-outline"
          />

          <SummaryCard
            label="Pending review"
            value={pendingCount}
            icon="time-outline"
            tone="accent"
          />

          <SummaryCard
            label="Verified"
            value={verifiedCount}
            icon="checkmark-circle-outline"
          />
        </View>

        {/* Preview data notice */}
        <View className="flex-row items-start gap-2 rounded-2xl border border-border bg-secondary p-3">
          <Icon
            name="information-circle-outline"
            size={18}
            color={colors.primary}
          />
          <Text className="flex-1 text-xs leading-5 text-secondary-foreground">
            Preview mode: these are sample submissions. Changes are
            temporary and are not saved to Supabase.
          </Text>
        </View>

        {/* Search */}
        <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4">
          <Icon name="search" size={18} color={colors.mutedForeground} />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search property, location, or Owner..."
            placeholderTextColor={colors.mutedForeground}
            className="min-w-0 flex-1 py-3.5 text-sm text-foreground"
            returnKeyType="search"
          />

          {search.length > 0 ? (
            <Pressable onPress={() => setSearch("")}>
              <Icon
                name="close-circle"
                size={18}
                color={colors.mutedForeground}
              />
            </Pressable>
          ) : null}
        </View>

        {/* Filters */}
        <View className="gap-2">
          <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Filter listings
          </Text>

          <View className="flex-row flex-wrap gap-2">
            <Chip
              label={`All (${totalCount})`}
              selected={filter === "all"}
              onPress={() => setFilter("all")}
            />

            <Chip
              label={`Pending (${pendingCount})`}
              selected={filter === "pending"}
              onPress={() => setFilter("pending")}
            />

            <Chip
              label={`Verified (${verifiedCount})`}
              selected={filter === "verified"}
              onPress={() => setFilter("verified")}
            />

            <Chip
              label={`Rejected (${rejectedCount})`}
              selected={filter === "rejected"}
              onPress={() => setFilter("rejected")}
            />
          </View>
        </View>

        {/* Listings */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-extrabold text-foreground">
              {filterTitle}
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
              onPress={() => setSelectedListing(listing)}
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
                  : filter === "pending"
                    ? "No pending submissions"
                    : filter === "verified"
                      ? "No verified listings"
                      : filter === "rejected"
                        ? "No rejected listings"
                        : "No listings yet"}
              </Text>

              <Text className="mt-2 text-center text-xs leading-5 text-muted-foreground">
                {search.trim()
                  ? "Try another property name, location, or Owner."
                  : "Owner-submitted listings will appear here when available."}
              </Text>

              {search.trim() ? (
                <Btn
                  label="Clear search"
                  variant="outline"
                  className="mt-4"
                  onPress={() => setSearch("")}
                />
              ) : null}
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Listing review modal */}
      <ListingReviewModal
        visible={selectedListing !== null}
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
        onVerify={verifyListing}
        onReject={openRejection}
        onTogglePublication={togglePublication}
      />

      {/* Required rejection reason modal */}
      <RejectListingModal
        visible={rejectionListing !== null}
        listing={rejectionListing}
        onClose={() => setRejectionListing(null)}
        onSubmit={rejectListing}
      />
    </View>
  );
}