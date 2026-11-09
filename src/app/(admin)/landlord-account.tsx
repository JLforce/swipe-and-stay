import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { Btn, Card, SectionTitle } from "../../components/kit";
import { colors } from "../../constants/brand";
import { boardersStore, landlordProfileStore, myListingsStore } from "../../lib/landlordStore";
import { useApp } from "../../lib/store";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className="text-sm font-semibold text-foreground">{value}</Text>
    </View>
  );
}

function Field({ placeholder, value, onChangeText, phone }: { placeholder: string; value: string; onChangeText: (t: string) => void; phone?: boolean }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.mutedForeground}
      keyboardType={phone ? "phone-pad" : "default"}
      className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
    />
  );
}

export default function LandlordAccount() {
  const router = useRouter();
  const { account, flash, signOut } = useApp();
  const [profile] = landlordProfileStore.use();
  const [mine] = myListingsStore.use();
  const [boarders] = boardersStore.use();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");

  function startEdit() {
    setName(profile.name);
    setContact(profile.contact);
    setEditing(true);
  }

  const a = account as unknown as { name?: string; email?: string } | null;

  function save() {
    landlordProfileStore.set({ name: name.trim(), contact: contact.trim() });
    setEditing(false);
    flash("Profile saved");
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 px-4 pb-10" keyboardShouldPersistTaps="handled">
      <Card className="gap-3">
        <Text className="text-base font-extrabold text-foreground">{profile.name || a?.name || "Your name"}</Text>
        <Row label="Email" value={a?.email || "Not set"} />
        <Row label="Contact number" value={profile.contact || "Not set"} />
        {editing ? (
          <View className="gap-3">
            <Field placeholder="Full name" value={name} onChangeText={setName} />
            <Field placeholder="Contact number" value={contact} onChangeText={setContact} phone />
            <View className="flex-row gap-2">
              <Btn label="Save" className="px-3 py-2" onPress={save} />
              <Btn variant="outline" label="Cancel" className="px-3 py-2" onPress={() => setEditing(false)} />
            </View>
          </View>
        ) : (
          <Btn variant="outline" className="px-3 py-2" icon="pencil" label="Edit profile" onPress={startEdit} />
        )}
      </Card>

      <View>
        <SectionTitle>Your properties</SectionTitle>
        <Card className="gap-3">
          <Row label="Listings" value={`${mine.length}`} />
          <Row label="Boarders" value={`${boarders.length}`} />
          <Row label="Student ratings" value="No reviews yet" />
        </Card>
      </View>

      <Btn
        variant="outline"
        label="Sign out"
        onPress={() => {
          signOut();
          router.replace("/login");
        }}
      />
    </ScrollView>
  );
}