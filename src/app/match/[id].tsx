import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ModalHeader } from "../../components/AppHeader";
import { Card, Icon, Meter } from "../../components/kit";
import { colors } from "../../constants/brand";
import { callFn } from "../../lib/api";
import { explainFactors, matchScore } from "../../lib/matching";
import { useApp } from "../../lib/store";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function MatchExplanation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { listings, prefs, weights, swipes } = useApp();
  const l = listings.find((x) => x.id === id);

  // AI explanation (SRS 3.1.5). Only real database listings can be explained; for demo listings,
  // or if the call fails, the rule-based breakdown below is all the student sees.
  const canExplain = !!id && UUID.test(id);
  const [ai, setAi] = useState<{ id: string; text: string | null } | null>(null);
  useEffect(() => {
    if (!canExplain) return;
    let live = true;
    callFn<{ explanation: string }>("explain-match", { listing_id: id })
      .then((r) => (live ? setAi({ id, text: r.explanation }) : undefined))
      .catch(() => (live ? setAi({ id, text: null }) : undefined));
    return () => {
      live = false;
    };
  }, [id, canExplain]);
  const aiDone = ai?.id === id;
  const aiText = aiDone ? ai.text : null;
  const aiLoading = canExplain && !aiDone;

  return (
    <View className="flex-1 bg-background">
      <ModalHeader title="Why this listing?" onClose={() => router.back()} />
      {l ? (
        <ScrollView contentContainerClassName="gap-4 p-5 pb-12">
          <Card className="gap-2 bg-primary/5">
            <View className="flex-row items-center gap-2">
              <Icon name="sparkles" size={16} color={colors.primary} />
              <Text className="flex-1 text-sm font-extrabold text-foreground">
                {matchScore(l, prefs, weights)}% match for {l.title}
              </Text>
            </View>
            <Text className="text-sm text-foreground/80">
              The score blends four factors, each weighted by what you seem to care about. Every swipe nudges the weights and re-ranks your deck
              {swipes.length ? ` (${swipes.length} swipe${swipes.length === 1 ? "" : "s"} so far).` : "."}
            </Text>
          </Card>
          {aiLoading ? (
            <Card className="flex-row items-center gap-3">
              <ActivityIndicator color={colors.primary} />
              <Text className="flex-1 text-xs text-muted-foreground">Writing your explanation… this can take up to 10 seconds.</Text>
            </Card>
          ) : aiText ? (
            <Card className="gap-1 border-primary/30 bg-primary/5">
              <Text className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Why this matches you</Text>
              <Text className="text-sm leading-5 text-foreground">{aiText}</Text>
            </Card>
          ) : null}
          {explainFactors(l, prefs, weights).map((row) => (
            <Card key={row.label} className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-bold text-foreground">{row.label}</Text>
                <Text className="text-sm font-extrabold text-primary">{row.value}%</Text>
              </View>
              <Meter value={row.value} />
              <Text className="text-xs text-muted-foreground">{row.note}</Text>
              <Text className="text-[11px] font-semibold text-muted-foreground">Weight in your score: {row.weight}%</Text>
            </Card>
          ))}
          <Text className="text-center text-[11px] text-muted-foreground">
            Rules-based adaptive matching (not machine learning).{aiText ? " The summary above is written by AI and may be imperfect." : ""}
          </Text>
        </ScrollView>
      ) : (
        <Text className="p-5 text-sm text-muted-foreground">Listing not found.</Text>
      )}
    </View>
  );
}
