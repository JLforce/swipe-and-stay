import { useState } from "react";
import { Alert, ScrollView, Text, TextInput, View } from "react-native";
import { Btn, Card, Tag } from "../../components/kit";
import { colors } from "../../constants/brand";
import { boardersStore } from "../../lib/landlordStore";
import { useApp } from "../../lib/store";

function Field({ placeholder, value, onChangeText, numeric }: { placeholder: string; value: string; onChangeText: (t: string) => void; numeric?: boolean }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.mutedForeground}
      keyboardType={numeric ? "numeric" : "default"}
      className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
    />
  );
}

export default function Boarders() {
  const { flash } = useApp();
  const [boarders] = boardersStore.use();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [rent, setRent] = useState("");

  function save() {
    if (!name.trim()) {
      flash("Enter the boarder's name");
      return;
    }
    boardersStore.set((p) => [...p, { id: String(Date.now()), name: name.trim(), room: room.trim(), rent: rent.trim(), paid: false }]);
    setName("");
    setRoom("");
    setRent("");
    setAdding(false);
    flash("Boarder added");
  }

  function moveOut(id: string, who: string) {
    Alert.alert("Move out?", `${who} will be removed.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Move out", style: "destructive", onPress: () => boardersStore.set((p) => p.filter((x) => x.id !== id)) },
    ]);
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-3 px-4 pb-10" keyboardShouldPersistTaps="handled">
      <Btn icon={adding ? "close" : "add"} label={adding ? "Cancel" : "Add a boarder"} onPress={() => setAdding((v) => !v)} />

      {adding ? (
        <Card className="gap-3">
          <Field placeholder="Full name" value={name} onChangeText={setName} />
          <Field placeholder="Room (e.g. Room 1)" value={room} onChangeText={setRoom} />
          <Field placeholder="Monthly rent" value={rent} onChangeText={setRent} numeric />
          <Btn label="Save boarder" onPress={save} />
        </Card>
      ) : null}

      <Text className="text-xs text-muted-foreground">{boarders.length} boarders in your properties</Text>

      {boarders.map((b) => (
        <Card key={b.id} className="gap-3">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <Text className="text-xs font-extrabold text-primary">
                {b.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-foreground">{b.name}</Text>
              <Text className="text-xs text-muted-foreground">
                {b.room || "No room set"}
                {b.rent ? ` · ₱${b.rent}/mo` : ""}
              </Text>
            </View>
            <Tag tone={b.paid ? "accent" : "primary"}>{b.paid ? "Paid" : "Rent due"}</Tag>
          </View>
          <View className="flex-row gap-2">
            {!b.paid ? (
              <Btn
                label="Mark paid"
                className="px-3 py-2"
                onPress={() => boardersStore.set((p) => p.map((x) => (x.id === b.id ? { ...x, paid: true } : x)))}
              />
            ) : null}
            <Btn variant="outline" label="Move out" className="px-3 py-2" onPress={() => moveOut(b.id, b.name)} />
          </View>
        </Card>
      ))}

      {boarders.length === 0 ? (
        <Text className="px-1 text-sm text-muted-foreground">No boarders yet. Add the people staying in your properties.</Text>
      ) : null}
    </ScrollView>
  );
}