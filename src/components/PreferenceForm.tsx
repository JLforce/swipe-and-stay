import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AMENITY_VOCAB, BUDGET_PRESETS, CAMPUSES, HOUSING_TYPES } from "../constants/housing";
import { cn } from "../lib/cn";
import type { Prefs, RoommatePref } from "../lib/matching";
import { Btn, Chip, SectionTitle } from "./kit";

const ROOMMATE: { id: RoommatePref; label: string }[] = [
  { id: "solo", label: "Solo" },
  { id: "shared", label: "Shared" },
  { id: "any", label: "No preference" },
];

/** SRS 3.1.2 – campus, budget range, housing type, roommate preference (+ optional must-have amenities, DEC-07). */
export function PreferenceForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial: Prefs;
  submitLabel: string;
  onSubmit: (p: Prefs) => void;
}) {
  const [p, setP] = useState<Prefs>(initial);
  const toggleAmenity = (a: string) =>
    setP((cur) => ({
      ...cur,
      desiredAmenities: cur.desiredAmenities.includes(a)
        ? cur.desiredAmenities.filter((x) => x !== a)
        : [...cur.desiredAmenities, a],
    }));

  return (
    <View className="gap-6">
      <View>
        <SectionTitle>Your campus</SectionTitle>
        <View className="gap-2">
          {CAMPUSES.map((c) => {
            const on = p.campus.id === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => setP({ ...p, campus: c })}
                className={cn("rounded-2xl border px-4 py-3 active:opacity-80", on ? "border-primary bg-primary/10" : "border-border bg-card")}
              >
                <Text className={cn("text-sm font-semibold", on ? "text-primary" : "text-foreground")}>{c.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View>
        <SectionTitle>Monthly budget</SectionTitle>
        <View className="flex-row flex-wrap gap-2">
          {BUDGET_PRESETS.map((b) => (
            <Chip
              key={b.label}
              label={b.label}
              selected={p.budgetMin === b.min && p.budgetMax === b.max}
              onPress={() => setP({ ...p, budgetMin: b.min, budgetMax: b.max })}
            />
          ))}
        </View>
      </View>

      <View>
        <SectionTitle>Housing type</SectionTitle>
        <View className="flex-row flex-wrap gap-2">
          <Chip label="Any" selected={p.housingType === "Any"} onPress={() => setP({ ...p, housingType: "Any" })} />
          {HOUSING_TYPES.map((t) => (
            <Chip key={t} label={t} selected={p.housingType === t} onPress={() => setP({ ...p, housingType: t })} />
          ))}
        </View>
      </View>

      <View>
        <SectionTitle>Roommate preference</SectionTitle>
        <View className="flex-row flex-wrap gap-2">
          {ROOMMATE.map((r) => (
            <Chip key={r.id} label={r.label} selected={p.roommate === r.id} onPress={() => setP({ ...p, roommate: r.id })} />
          ))}
        </View>
      </View>

      <View>
        <SectionTitle>Must-have amenities (optional)</SectionTitle>
        <View className="flex-row flex-wrap gap-2">
          {AMENITY_VOCAB.map((a) => (
            <Chip key={a} label={a} selected={p.desiredAmenities.includes(a)} onPress={() => toggleAmenity(a)} />
          ))}
        </View>
      </View>

      <Btn label={submitLabel} icon="arrow-forward" onPress={() => onSubmit(p)} />
    </View>
  );
}
