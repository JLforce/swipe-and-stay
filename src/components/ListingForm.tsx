import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, View } from "react-native";
import { HOUSING_TYPES, type HousingType } from "../constants/housing";
import { colors } from "../constants/brand";
import type { Listing } from "../data/mockData";
import { ModalHeader } from "./AppHeader";
import { Btn, Chip, Photo } from "./kit";

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "default" | "numeric" | "decimal-pad" | "email-address" | "phone-pad";
  multiline?: boolean;
}) {
  return (
    <View>
      <Text className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholderTextColor={colors.mutedForeground}
        className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
        style={multiline ? { minHeight: 80, textAlignVertical: "top" } : undefined}
      />
    </View>
  );
}

const BLANK: Listing = {
  id: "",
  title: "",
  area: "",
  type: "Boarding House",
  price: 0,
  amenities: [],
  photo: "from-emerald-700 via-teal-600 to-emerald-400",
  gallery: [],
  safety: { score: 80, notes: [] },
  landlord: { name: "", verified: false, responseTime: "~1 day", phone: "", email: "" },
  occupancy: "solo",
  description: "",
  slotsLeft: 1,
  active: true,
  coords: { lat: 10.3157, lng: 123.8854 },
};

/** SRS 3.1.3 – admin add/edit listing (price, location, type, amenities, description, coordinates). */
export function ListingFormModal({
  visible,
  listing,
  onClose,
  onSave,
}: {
  visible: boolean;
  listing: Listing | null; // null = add new
  onClose: () => void;
  onSave: (l: Listing) => void;
}) {
  const base = listing ?? BLANK;
  const [title, setTitle] = useState(base.title);
  const [area, setArea] = useState(base.area);
  const [price, setPrice] = useState(String(base.price || ""));
  const [type, setType] = useState<HousingType>(base.type);
  const [amenities, setAmenities] = useState(base.amenities.join(", "));
  const [description, setDescription] = useState(base.description);
  const [lat, setLat] = useState(String(base.coords.lat));
  const [lng, setLng] = useState(String(base.coords.lng));
  const [landlord, setLandlord] = useState(base.landlord.name);
  const [phone, setPhone] = useState(base.landlord.phone);
  const [email, setEmail] = useState(base.landlord.email);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const priceN = Number(price);
    const latN = Number(lat);
    const lngN = Number(lng);
    if (!title.trim() || !area.trim()) return setError("Title and area are required.");
    if (!Number.isFinite(priceN) || priceN <= 0) return setError("Enter a valid monthly rent.");
    if (!Number.isFinite(latN) || !Number.isFinite(lngN)) return setError("Enter valid coordinates.");
    setError(null);
    onSave({
      ...base,
      id: listing?.id ?? `l${Date.now()}`,
      title: title.trim(),
      area: area.trim(),
      price: priceN,
      type,
      amenities: amenities.split(",").map((a) => a.trim()).filter(Boolean),
      description: description.trim(),
      coords: { lat: latN, lng: lngN },
      landlord: { ...base.landlord, name: landlord.trim(), phone: phone.trim(), email: email.trim() },
    });
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-background">
        <ModalHeader title={listing ? "Edit listing" : "Add listing"} onClose={onClose} />
        <ScrollView contentContainerClassName="gap-3 p-5 pb-16" keyboardShouldPersistTaps="handled">
          <Photo gradient={base.photo} className="h-32 w-full rounded-3xl" label="Photo upload comes with Supabase Storage" />
          <Field label="Title" value={title} onChangeText={setTitle} />
          <Field label="Area / address" value={area} onChangeText={setArea} />
          <Field label="Monthly rent (PHP)" value={price} onChangeText={setPrice} keyboardType="numeric" />
          <View>
            <Text className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Type</Text>
            <View className="flex-row flex-wrap gap-2">
              {HOUSING_TYPES.map((t) => (
                <Chip key={t} label={t} selected={type === t} onPress={() => setType(t)} />
              ))}
            </View>
          </View>
          <Field label="Amenities (comma separated)" value={amenities} onChangeText={setAmenities} />
          <Field label="Description" value={description} onChangeText={setDescription} multiline />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Field label="Latitude" value={lat} onChangeText={setLat} keyboardType="decimal-pad" />
            </View>
            <View className="flex-1">
              <Field label="Longitude" value={lng} onChangeText={setLng} keyboardType="decimal-pad" />
            </View>
          </View>
          <Field label="Landlord name" value={landlord} onChangeText={setLandlord} />
          <Field label="Landlord phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Field label="Landlord email" value={email} onChangeText={setEmail} keyboardType="email-address" />
          {error ? (
            <Text className="rounded-2xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">{error}</Text>
          ) : null}
          <Btn label="Save listing" onPress={submit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
