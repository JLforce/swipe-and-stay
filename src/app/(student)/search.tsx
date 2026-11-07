import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Card, Icon, Photo, Tag } from "../../components/kit";
import { colors } from "../../constants/brand";
import { peso } from "../../lib/format";
import { runSearch, SEARCH_SAMPLE_PROMPT, SEARCH_SUGGESTIONS } from "../../lib/search";
import { useApp } from "../../lib/store";

export default function Search() {
  const router = useRouter();
  const { listings, prefs, weights, flash } = useApp();
  const [input, setInput] = useState(SEARCH_SAMPLE_PROMPT);
  const [asked, setAsked] = useState(SEARCH_SAMPLE_PROMPT);

  const outcome = useMemo(() => runSearch(asked, listings, prefs, weights), [asked, listings, prefs, weights]);

  function submit(text: string) {
    const t = text.trim();
    if (!t) return;
    setInput(t);
    setAsked(t);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-4 px-4 pb-10" keyboardShouldPersistTaps="handled">
        <Card className="gap-1 bg-primary/5">
          <View className="flex-row items-center gap-2">
            <Icon name="sparkles" size={16} color={colors.primary} />
            <Text className="text-sm font-extrabold text-primary">Search Assistant</Text>
          </View>
          <Text className="text-sm text-foreground/80">
            Ask in plain language, in English or Taglish. It turns your sentence into filters and ranks the results using your learned preferences.
          </Text>
        </Card>

        <View className="flex-row items-center gap-2 rounded-3xl border border-border bg-card p-2">
          <View className="pl-2">
            <Icon name="search" size={16} color={colors.mutedForeground} />
          </View>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => submit(input)}
            returnKeyType="search"
            placeholder="Ask for the place you want…"
            placeholderTextColor={colors.mutedForeground}
            className="flex-1 py-2 text-sm text-foreground"
          />
          <Pressable
            onPress={() => flash("Voice search is a placeholder for now")}
            accessibilityLabel="Voice search (placeholder)"
            className="h-9 w-9 items-center justify-center rounded-full bg-accent/15 active:opacity-80"
          >
            <Icon name="mic" size={16} color={colors.accent} />
          </Pressable>
          <Pressable
            onPress={() => submit(input)}
            accessibilityLabel="Search"
            className="h-9 w-9 items-center justify-center rounded-full bg-primary active:opacity-80"
          >
            <Icon name="arrow-up" size={18} color={colors.primaryForeground} />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-4" keyboardShouldPersistTaps="handled">
          {SEARCH_SUGGESTIONS.map((s) => (
            <Pressable key={s} onPress={() => submit(s)} className="rounded-full border border-border bg-card px-3 py-2 active:opacity-70">
              <Text className="text-xs font-semibold text-foreground/80">{s}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View className="gap-3">
          <View className="max-w-[85%] self-end rounded-3xl rounded-br-md bg-primary px-4 py-2.5">
            <Text className="text-sm text-primary-foreground">{asked}</Text>
          </View>
          <Card className="max-w-[94%] gap-3 self-start rounded-bl-md">
            <Text className="text-sm text-foreground/85">{outcome.message}</Text>
            {outcome.chips.length > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                {outcome.chips.map((c) => (
                  <Tag key={c.label} tone="primary">{`${c.label}: ${c.value}`}</Tag>
                ))}
              </View>
            ) : null}
            {outcome.ignored.length > 0 ? (
              <Text className="text-xs text-muted-foreground">Not tracked yet, so ignored: {outcome.ignored.join(", ")}.</Text>
            ) : null}
          </Card>
        </View>

        <Text className="px-1 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Matching listings</Text>
        {outcome.hits.map(({ listing: l, score, km }) => (
          <Pressable key={l.id} onPress={() => router.push({ pathname: "/listing/[id]", params: { id: l.id } })} className="active:opacity-80">
            <Card className="flex-row items-center gap-3 p-3">
              <Photo gradient={l.photo} className="h-16 w-16 rounded-2xl" />
              <View className="flex-1 gap-1">
                <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
                  {l.title}
                </Text>
                <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                  {l.area}
                </Text>
                <View className="flex-row flex-wrap gap-1.5">
                  <Tag tone="accent" icon="walk">{`${km.toFixed(1)} km`}</Tag>
                  <Tag>{l.type}</Tag>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-sm font-extrabold text-primary">{peso(l.price)}</Text>
                <Text className="text-[11px] font-bold text-accent">{score}%</Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
