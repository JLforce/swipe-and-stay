
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import {
  Btn,
  Card,
  Icon,
  Photo,
  SectionTitle,
  Tag,
} from "../kit";
import { colors } from "../../constants/brand";
import type { AdminListingPreview } from "../../data/adminListingPreview";
import { peso } from "../../lib/format";

interface ListingReviewModalProps {
  visible: boolean;
  listing: AdminListingPreview | null;
  onClose: () => void;
  onVerify: (listing: AdminListingPreview) => void;
  onReject: (listing: AdminListingPreview) => void;
  onTogglePublication: (listing: AdminListingPreview) => void;
}

function StatusTag({
  status,
}: {
  status: AdminListingPreview["verificationStatus"];
}) {
  const config = {
    pending: { label: "Pending Review", tone: "accent" as const },
    verified: { label: "Verified", tone: "primary" as const },
    rejected: { label: "Rejected", tone: "danger" as const },
  };

  const item = config[status];

  return <Tag tone={item.tone}>{item.label}</Tag>;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View className="gap-1 border-b border-border py-3">
      <Text className="text-xs font-semibold text-muted-foreground">
        {label}
      </Text>
      <Text className="text-sm font-semibold text-foreground">
        {value}
      </Text>
    </View>
  );
}

export function ListingReviewModal({
  visible,
  listing,
  onClose,
  onVerify,
  onReject,
  onTogglePublication,
}: ListingReviewModalProps) {
  if (!listing) return null;

  const isPending = listing.verificationStatus === "pending";
  const isVerified = listing.verificationStatus === "verified";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-[94%] overflow-hidden rounded-t-3xl bg-background">
          {/* Modal header */}
          <View className="flex-row items-center justify-between border-b border-border px-5 py-4">
            <View className="flex-1 gap-1">
              <Text className="text-lg font-extrabold text-foreground">
                Listing Review
              </Text>
              <Text className="text-xs text-muted-foreground">
                Review the property submission and its details.
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close listing review"
              className="h-10 w-10 items-center justify-center rounded-full bg-secondary"
            >
              <Icon name="close" size={20} color={colors.foreground} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="gap-5 px-5 pb-8 pt-4"
          >
            {/* Property heading */}
            <View className="gap-2">
              <View className="flex-row flex-wrap items-center gap-2">
                <StatusTag status={listing.verificationStatus} />
                <Tag tone="muted">
                  {listing.publicationStatus === "published"
                    ? "Published"
                    : "Unpublished"}
                </Tag>
              </View>

              <Text className="text-xl font-extrabold text-foreground">
                {listing.title}
              </Text>

              <View className="flex-row items-center gap-2">
                <Icon
                  name="location-outline"
                  size={15}
                  color={colors.mutedForeground}
                />
                <Text className="flex-1 text-sm text-muted-foreground">
                  {listing.address}
                </Text>
              </View>

              <Text className="text-2xl font-extrabold text-primary">
                {peso(listing.price)}
                <Text className="text-sm font-medium text-muted-foreground">
                  {" "}/ month
                </Text>
              </Text>
            </View>

            {/* Property photo gallery */}
            <View className="gap-2">
              <SectionTitle>Property photos</SectionTitle>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-3"
              >
                {[listing.photo, ...listing.gallery].map((photo, index) => (
                  <View key={`${listing.id}-photo-${index}`}>
                    <Photo
                      gradient={photo}
                      className="h-44 w-64 rounded-2xl"
                      label={`Preview image ${index + 1}`}
                    />
                  </View>
                ))}
              </ScrollView>

              <Text className="text-[11px] text-muted-foreground">
                UI preview placeholders. Actual property photos will be
                connected during backend integration.
              </Text>
            </View>

            {/* Property information */}
            <Card className="gap-1">
              <SectionTitle>Property information</SectionTitle>

              <DetailRow label="Property name" value={listing.title} />
              <DetailRow label="Housing type" value={listing.type} />
              <DetailRow
                label="Occupancy"
                value={
                  listing.occupancy === "shared"
                    ? "Shared accommodation"
                    : "Private accommodation"
                }
              />
              <DetailRow label="Monthly rent" value={peso(listing.price)} />
              <DetailRow label="Full address" value={listing.address} />

              <View className="gap-2 pt-3">
                <Text className="text-xs font-semibold text-muted-foreground">
                  Description
                </Text>
                <Text className="text-sm leading-6 text-foreground">
                  {listing.description}
                </Text>
              </View>
            </Card>

            {/* Amenities */}
            <Card className="gap-3">
              <SectionTitle>Amenities and facilities</SectionTitle>

              <View className="flex-row flex-wrap gap-2">
                {listing.amenities.map((amenity) => (
                  <Tag key={amenity} tone="muted">
                    {amenity}
                  </Tag>
                ))}
              </View>
            </Card>

            {/* Location */}
            <Card className="gap-1">
              <SectionTitle>Property location</SectionTitle>

              <DetailRow
                label="Latitude"
                value={String(listing.coords.lat)}
              />
              <DetailRow
                label="Longitude"
                value={String(listing.coords.lng)}
              />
            </Card>

            {/* Owner information */}
            <Card className="gap-1">
              <SectionTitle>Submitted by Owner</SectionTitle>

              <View className="flex-row items-center gap-3 py-2">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon
                    name="person-outline"
                    size={21}
                    color={colors.primary}
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-sm font-extrabold text-foreground">
                    {listing.owner.name}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    Property Owner
                  </Text>
                </View>
              </View>

              <DetailRow label="Email address" value={listing.owner.email} />
              <DetailRow label="Contact number" value={listing.owner.phone} />
            </Card>

            {/* Submission and review status */}
            <Card className="gap-3">
              <SectionTitle>Submission information</SectionTitle>

              <DetailRow
                label="Submitted on"
                value={new Date(listing.submittedAt).toLocaleString()}
              />

              <View className="gap-2">
                <Text className="text-xs font-semibold text-muted-foreground">
                  Verification status
                </Text>
                <StatusTag status={listing.verificationStatus} />
              </View>

              <View className="gap-2">
                <Text className="text-xs font-semibold text-muted-foreground">
                  Publication status
                </Text>
                <Tag tone="muted">
                  {listing.publicationStatus === "published"
                    ? "Published"
                    : "Unpublished"}
                </Tag>
              </View>

              {listing.rejectionReason ? (
                <View className="gap-2 rounded-xl bg-destructive/5 p-3">
                  <Text className="text-xs font-bold text-destructive">
                    Rejection reason
                  </Text>
                  <Text className="text-sm leading-5 text-foreground">
                    {listing.rejectionReason}
                  </Text>
                </View>
              ) : null}
            </Card>

            {/* Review actions */}
            {isPending ? (
              <View className="gap-3">
                <Text className="text-sm font-extrabold text-foreground">
                  Review decision
                </Text>

                <Btn
                  label="Verify listing"
                  icon="checkmark-circle-outline"
                  onPress={() => onVerify(listing)}
                />

                <Btn
                  label="Reject listing"
                  icon="close-circle-outline"
                  variant="danger"
                  onPress={() => onReject(listing)}
                />

                <Text className="text-center text-xs leading-5 text-muted-foreground">
                  Verify only when the submitted property information and
                  supporting details have been reviewed.
                </Text>
              </View>
            ) : null}

            {isVerified ? (
              <View className="gap-3">
                <Text className="text-sm font-extrabold text-foreground">
                  Publication management
                </Text>

                <Btn
                  label={
                    listing.publicationStatus === "published"
                      ? "Unpublish listing"
                      : "Publish listing"
                  }
                  icon={
                    listing.publicationStatus === "published"
                      ? "eye-off-outline"
                      : "eye-outline"
                  }
                  variant={
                    listing.publicationStatus === "published"
                      ? "outline"
                      : "primary"
                  }
                  onPress={() => onTogglePublication(listing)}
                />

                <Text className="text-xs leading-5 text-muted-foreground">
                  Only verified listings can be published.
                </Text>
              </View>
            ) : null}

            <Btn
              label="Close review"
              variant="outline"
              onPress={onClose}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
