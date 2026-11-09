import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ModalHeader } from "../../components/AppHeader";
import { Card, Icon, Meter } from "../../components/kit";
import { colors } from "../../constants/brand";
import { explainFactors, matchScore } from "../../lib/matching";
import { useApp } from "../../lib/store";

export default function MatchExplanation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { listings, prefs, weights, swipes } = useApp();
  const l = listings.find((x) => x.id === id);

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
            Rules-based adaptive matching (not machine learning). Natural-language captions from the LLM come later.
          </Text>
        </ScrollView>
      ) : (
        <Text className="p-5 text-sm text-muted-foreground">Listing not found.</Text>
      )}
    </View>
  );
}
