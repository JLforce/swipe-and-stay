import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors } from "../constants/brand";
import { AMENITY_VOCAB, HOUSING_TYPES, type HousingType } from "../constants/housing";
import type { Listing } from "../data/mockData";
import {
  MAX_LISTING_PHOTOS,
  uploadListingPhoto,
  type ListingDraft,
} from "../lib/listings";
import { ModalHeader } from "./AppHeader";
import { Btn, Chip, Icon } from "./kit";

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  multiline,
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "default" | "numeric" | "decimal-pad" | "email-address" | "phone-pad";
  multiline?: boolean;
  hint?: string;
}) {
  return (
    <View>
      <Text className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholderTextColor={colors.mutedForeground}
        className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
        style={multiline ? { minHeight: 90, textAlignVertical: "top" } : undefined}
      />
      {hint ? (
        <Text className="mt-1 text-[11px] text-muted-foreground">{hint}</Text>
      ) : null}
    </View>
  );
}

// Central Cebu City, used as the starting point for a new listing.
const DEFAULT_LAT = "10.3157";
const DEFAULT_LNG = "123.8854";

/**
 * Add or edit one of the signed-in owner's listings.
 * Photos upload right away; the listing itself is saved by onSave.
 */
export function OwnerListingFormModal({
  visible,
  ownerId,
  listing,
  defaults,
  onClose,
  onSave,
  onDelete,
}: {
  visible: boolean;
  ownerId: string;
  listing: Listing | null; // null = add new
  /** Pre-filled contact details for a new listing. */
  defaults: { landlordName: string; landlordEmail: string };
  onClose: () => void;
  onSave: (draft: ListingDraft) => Promise<void>;
  /** Shown only when editing an existing listing. */
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState(listing?.title ?? "");
  const [address, setAddress] = useState(listing?.area ?? "");
  const [price, setPrice] = useState(listing ? String(listing.price) : "");
  const [type, setType] = useState<HousingType>(listing?.type ?? "Boarding House");
  const [occupancy, setOccupancy] = useState<"solo" | "shared">(listing?.occupancy ?? "shared");
  const [amenities, setAmenities] = useState<string[]>(listing?.amenities ?? []);
  const [description, setDescription] = useState(listing?.description ?? "");
  const [slots, setSlots] = useState(String(listing?.slotsLeft ?? 1));
  const [lat, setLat] = useState(listing ? String(listing.coords.lat) : DEFAULT_LAT);
  const [lng, setLng] = useState(listing ? String(listing.coords.lng) : DEFAULT_LNG);
  const [landlordName, setLandlordName] = useState(listing?.landlord.name ?? defaults.landlordName);
  const [phone, setPhone] = useState(listing?.landlord.phone ?? "");
  const [email, setEmail] = useState(listing?.landlord.email ?? defaults.landlordEmail);
  const [photos, setPhotos] = useState<string[]>(listing?.photoUrls ?? []);
  const [live, setLive] = useState(listing?.active ?? false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleAmenity(a: string) {
    setAmenities((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]));
  }

  async function addPhotos() {
    if (uploading) return;
    const room = MAX_LISTING_PHOTOS - photos.length;
    if (room <= 0) {
      setError(`You can add up to ${MAX_LISTING_PHOTOS} photos.`);
      return;
    }
    setError(null);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: room,
      quality: 0.7,
    });
    if (result.canceled) return;

    setUploading(true);
    try {
      const urls: string[] = [];
      for (const asset of result.assets.slice(0, room)) {
        urls.push(await uploadListingPhoto(ownerId, asset.uri, asset.mimeType));
      }
      setPhotos((cur) => [...cur, ...urls]);
    } catch (e) {
      setError(e instanceof Error ? `Photo upload failed: ${e.message}` : "Photo upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (saving || uploading) return;
    const priceN = Number(price);
    const slotsN = Number(slots);
    const latN = Number(lat);
    const lngN = Number(lng);

    if (!title.trim()) return setError("Please enter a title.");
    if (!address.trim()) return setError("Please enter the address.");
    if (!Number.isFinite(priceN) || priceN <= 0) return setError("Enter a valid monthly rent.");
    if (!Number.isInteger(slotsN) || slotsN < 0) return setError("Slots left must be 0 or more.");
    if (!Number.isFinite(latN) || latN < -90 || latN > 90) return setError("Latitude must be between -90 and 90.");
    if (!Number.isFinite(lngN) || lngN < -180 || lngN > 180) return setError("Longitude must be between -180 and 180.");
    if (live && photos.length === 0) return setError("Add at least one photo before making the listing live.");
    if (live && !phone.trim() && !email.trim()) return setError("Add a phone number or email so students can reach you.");

    setError(null);
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        address: address.trim(),
        price: priceN,
        type,
        occupancy,
        amenities,
        description: description.trim(),
        lat: latN,
        lng: lngN,
        slotsLeft: slotsN,
        landlordName: landlordName.trim(),
        landlordPhone: phone.trim(),
        landlordEmail: email.trim(),
        photoUrls: photos,
        isActive: live,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the listing.");
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 bg-background"
      >
        <ModalHeader title={listing ? "Edit listing" : "Post a rental"} onClose={onClose} />
        <ScrollView contentContainerClassName="gap-4 p-5 pb-16" keyboardShouldPersistTaps="handled">
          <View>
            <Text className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Photos ({photos.length}/{MAX_LISTING_PHOTOS})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              {photos.map((uri) => (
                <View key={uri} className="h-24 w-24 overflow-hidden rounded-2xl bg-secondary">
                  <Image source={{ uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                  <Pressable
                    onPress={() => setPhotos((cur) => cur.filter((x) => x !== uri))}
                    accessibilityLabel="Remove photo"
                    className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-black/60"
                  >
                    <Icon name="close" size={14} color="#fff" />
                  </Pressable>
                </View>
              ))}
              {photos.length < MAX_LISTING_PHOTOS ? (
                <Pressable
                  onPress={addPhotos}
                  disabled={uploading}
                  accessibilityLabel="Add photos"
                  className="h-24 w-24 items-center justify-center gap-1 rounded-2xl border border-dashed border-border bg-card active:opacity-70"
                >
                  {uploading ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <>
                      <Icon name="camera-outline" size={20} color={colors.primary} />
                      <Text className="text-[11px] font-bold text-primary">Add</Text>
                    </>
                  )}
                </Pressable>
              ) : null}
            </ScrollView>
          </View>

          <Field label="Title" value={title} onChangeText={setTitle} />
          <Field label="Address" value={address} onChangeText={setAddress} />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Field label="Monthly rent (PHP)" value={price} onChangeText={setPrice} keyboardType="numeric" />
            </View>
            <View className="flex-1">
              <Field label="Slots left" value={slots} onChangeText={setSlots} keyboardType="numeric" />
            </View>
          </View>

          <View>
            <Text className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Type</Text>
            <View className="flex-row flex-wrap gap-2">
              {HOUSING_TYPES.map((t) => (
                <Chip key={t} label={t} selected={type === t} onPress={() => setType(t)} />
              ))}
            </View>
          </View>

          <View>
            <Text className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Room sharing</Text>
            <View className="flex-row gap-2">
              <Chip label="Private (solo)" selected={occupancy === "solo"} onPress={() => setOccupancy("solo")} />
              <Chip label="Shared" selected={occupancy === "shared"} onPress={() => setOccupancy("shared")} />
            </View>
          </View>

          <View>
            <Text className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Amenities</Text>
            <View className="flex-row flex-wrap gap-2">
              {AMENITY_VOCAB.map((a) => (
                <Chip key={a} label={a} selected={amenities.includes(a)} onPress={() => toggleAmenity(a)} />
              ))}
            </View>
          </View>

          <Field label="Description" value={description} onChangeText={setDescription} multiline />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Field label="Latitude" value={lat} onChangeText={setLat} keyboardType="decimal-pad" />
            </View>
            <View className="flex-1">
              <Field label="Longitude" value={lng} onChangeText={setLng} keyboardType="decimal-pad" />
            </View>
          </View>
          <Text className="-mt-2 text-[11px] text-muted-foreground">
            Tip: in Google Maps, press and hold your building and copy the two numbers shown. Students use this to see how far you are from campus.
          </Text>

          <Field label="Contact name" value={landlordName} onChangeText={setLandlordName} />
          <Field label="Contact phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Field label="Contact email" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <Text className="-mt-2 text-[11px] text-muted-foreground">
            Students only see your phone and email after they save your listing. They can also message you in the app.
          </Text>

          <View className="flex-row items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-bold text-foreground">Visible to students</Text>
              <Text className="text-[11px] text-muted-foreground">
                {live ? "Live: students can swipe on this listing." : "Draft: only you can see this listing."}
              </Text>
            </View>
            <Switch
              value={live}
              onValueChange={setLive}
              trackColor={{ true: colors.primary }}
            />
          </View>

          {error ? (
            <Text className="rounded-2xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
              {error}
            </Text>
          ) : null}
          <Btn
            label={saving ? "Saving..." : listing ? "Save changes" : live ? "Post listing" : "Save as draft"}
            onPress={submit}
            disabled={saving || uploading}
          />
          {onDelete ? (
            <Btn variant="danger" icon="trash-outline" label="Delete this listing" onPress={onDelete} disabled={saving || uploading} />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
