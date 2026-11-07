import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";
import { Btn, Card, Icon, SectionTitle } from "../../components/kit";
import { colors } from "../../constants/brand";
import { SAMPLE_LEASE_TEXT, type LeaseResult } from "../../data/mockData";
import { submitLeaseReview } from "../../lib/mockApi";
import { useApp } from "../../lib/store";

function Block({ title, body }: { title: string; body: string }) {
  return (
    <View className="gap-0.5">
      <Text className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{title}</Text>
      <Text className="text-sm leading-5 text-foreground">{body}</Text>
    </View>
  );
}

export default function Lease() {
  const { notify } = useApp();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LeaseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await submitLeaseReview(text));
      notify({
        kind: "lease",
        title: "Lease summary ready",
        body: "Your plain-language lease summary is ready to review. It is informational, not legal advice.",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not analyze this lease. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-4 px-4 pb-10" keyboardShouldPersistTaps="handled">
        <Card className="gap-2 bg-secondary">
          <View className="flex-row items-center gap-2">
            <Icon name="document-text-outline" size={16} color={colors.primary} />
            <Text className="text-sm font-extrabold text-foreground">Lease review assistant</Text>
          </View>
          <Text className="text-sm text-muted-foreground">
            Paste your lease text. We summarize the deposit, notice period, utilities and penalties in plain language and flag clauses to double-check.
          </Text>
        </Card>

        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          placeholder="Paste lease text here…"
          placeholderTextColor={colors.mutedForeground}
          className="min-h-[160px] rounded-3xl border border-border bg-card p-4 text-sm text-foreground"
          style={{ textAlignVertical: "top" }}
        />
        <View className="flex-row gap-2">
          <Btn variant="outline" label="Use sample lease" className="flex-1" onPress={() => setText(SAMPLE_LEASE_TEXT)} />
          <Btn label="Analyze" icon="sparkles" className="flex-1" disabled={!text.trim() || loading} onPress={analyze} />
        </View>

        {loading ? (
          <Card className="items-center gap-2 py-6">
            <ActivityIndicator color={colors.primary} />
            <Text className="text-xs text-muted-foreground">Reading your lease… this can take up to 10 seconds.</Text>
          </Card>
        ) : null}

        {error ? <Text className="rounded-2xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">{error}</Text> : null}

        {result ? (
          <View className="gap-3">
            <SectionTitle>Summary</SectionTitle>
            <Card className="gap-3">
              <Text className="text-sm leading-5 text-foreground">{result.summary}</Text>
              <Block title="Deposit" body={result.deposit} />
              <Block title="Notice period" body={result.notice_period} />
              <Block title="Utilities" body={result.utilities_included} />
              <Block title="Penalties" body={result.penalties} />
            </Card>
            {result.flagged_clauses.length > 0 ? (
              <>
                <SectionTitle>Clauses to double-check</SectionTitle>
                {result.flagged_clauses.map((c) => (
                  <Card key={c.clause} className="gap-1 border-destructive/30 bg-destructive/5">
                    <View className="flex-row items-center gap-2">
                      <Icon name="warning-outline" size={16} color={colors.destructive} />
                      <Text className="text-sm font-bold text-foreground">{c.clause}</Text>
                    </View>
                    <Text className="text-sm text-foreground">{c.reason}</Text>
                  </Card>
                ))}
              </>
            ) : null}
          </View>
        ) : null}

        <Card className="flex-row items-start gap-2 border-destructive/30 bg-destructive/5">
          <Icon name="shield-outline" size={16} color={colors.destructive} />
          <Text className="flex-1 text-xs text-foreground">
            <Text className="font-extrabold">Not legal advice.</Text> This is an automated, informational summary. Have a real lease reviewed by a qualified professional before signing.
          </Text>
        </Card>
        <Text className="text-center text-[11px] text-muted-foreground">
          Prototype: results are sample output. The Cerebras-powered version arrives with the submit-lease-review Edge Function.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
