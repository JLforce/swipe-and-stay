import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Btn, Card, Icon, Logo, Tag } from "../../components/kit";
import { colors } from "../../constants/brand";
import { DEMO_ACCOUNTS, type DemoAccount, type Role } from "../../data/mockData";
import { cn } from "../../lib/cn";
import { useApp } from "../../lib/store";

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, flash } = useApp();
  const [role, setRole] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const demos = DEMO_ACCOUNTS.filter((a) => a.role === role);

  function submit() {
    const match = DEMO_ACCOUNTS.find(
      (a) => a.role === role && a.email === email.trim().toLowerCase() && a.password === password,
    );
    if (!match) return setError("That email and password don't match a demo account. Tap a sample account below.");
    setError(null);
    signIn(match);
    router.replace("/");
  }

  function fillDemo(a: DemoAccount) {
    setEmail(a.email);
    setPassword(a.password);
    setError(null);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-background">
      <ScrollView
        contentContainerClassName="px-6 pb-10"
        contentContainerStyle={{ paddingTop: insets.top + 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <Logo subtitle="Student housing in Cebu" />
        <Text className="mt-6 text-3xl font-extrabold text-foreground">Sign in</Text>
        <Text className="mt-2 text-sm text-muted-foreground">Students swipe and save listings. The admin manages the listing pool.</Text>

        <View className="mt-5 flex-row gap-2 rounded-3xl bg-secondary p-1.5">
          {(["student", "admin"] as Role[]).map((r) => (
            <Pressable
              key={r}
              onPress={() => {
                setRole(r);
                setEmail("");
                setPassword("");
                setError(null);
              }}
              className={cn("flex-1 items-center rounded-2xl py-2.5", role === r && "bg-card")}
            >
              <Text className={cn("text-xs font-extrabold", role === r ? "text-primary" : "text-muted-foreground")}>
                {r === "student" ? "Student" : "Admin"}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="mt-5 gap-3">
          <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4">
            <Icon name="mail-outline" size={16} color={colors.mutedForeground} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="email"
              placeholderTextColor={colors.mutedForeground}
              className="flex-1 py-3.5 text-sm text-foreground"
            />
          </View>
          <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4">
            <Icon name="lock-closed-outline" size={16} color={colors.mutedForeground} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="password"
              placeholderTextColor={colors.mutedForeground}
              className="flex-1 py-3.5 text-sm text-foreground"
            />
          </View>
          {error ? (
            <Text className="rounded-2xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">{error}</Text>
          ) : null}
          <Btn label={role === "student" ? "Enter my deck" : "Open admin dashboard"} icon="arrow-forward" onPress={submit} />
          <Btn variant="outline" label="Continue with Google" onPress={() => flash("Google sign-in arrives with Supabase Auth")} />
        </View>

        <Card className="mt-6 gap-3 bg-primary/5">
          <View className="flex-row items-center gap-2">
            <Icon name="shield-checkmark-outline" size={16} color={colors.primary} />
            <Text className="text-sm font-extrabold text-primary">Sample accounts (dev only)</Text>
          </View>
          {demos.map((a) => (
            <Pressable key={a.email} onPress={() => fillDemo(a)} className="flex-row items-center justify-between rounded-2xl bg-card px-3 py-2.5 active:opacity-80">
              <View className="flex-1 pr-2">
                <Text className="text-sm font-bold text-foreground">{a.name}</Text>
                <Text className="text-[11px] text-muted-foreground">
                  {a.email} · {a.password}
                </Text>
              </View>
              <Tag tone="accent">Use</Tag>
            </Pressable>
          ))}
          <Text className="text-[11px] text-muted-foreground">
            The real app signs in with Google through Supabase Auth (SRS 3.1.1). These accounts exist only for the offline prototype.
          </Text>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
