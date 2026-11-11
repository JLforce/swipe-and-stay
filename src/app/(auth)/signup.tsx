import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Btn, Card, Icon, Logo } from "../../components/kit";
import { cn } from "../../lib/cn";
import { colors } from "../../constants/brand";
import {
    MIN_PASSWORD_LENGTH,
    signInWithGoogle,
    signUpWithEmail,
} from "../../lib/auth";

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoComplete,
  editable,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "words";
  autoComplete?: "name" | "email" | "new-password";
  editable?: boolean;
}) {
  return (
    <View>
      <Text className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        autoCorrect={false}
        editable={editable}
        className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
      />
    </View>
  );
}

export default function Signup() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ type?: string }>();
  const [accountType, setAccountType] = useState<"student" | "owner">(
    params.type === "owner" ? "owner" : "student",
  );
  const isOwner = accountType === "owner";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitEmail() {
    if (busy) return;
    setError(null);

    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      await signUpWithEmail(name, email, password, accountType);
      // The root screen sends the new student to onboarding.
      router.replace("/");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Sign up failed. Please try again.",
      );
      setBusy(false);
    }
  }

  async function submitGoogle() {
    if (busy) return;
    setBusy(true);
    setError(null);
    let redirecting = false;
    try {
      const account = await signInWithGoogle(accountType);
      if (account) {
        router.replace("/");
      } else if (Platform.OS === "web") {
        // Web: the browser is leaving for Google, so keep the buttons disabled.
        redirecting = true;
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Google sign-in failed. Please try again.",
      );
    } finally {
      if (!redirecting) setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerClassName="px-6 pb-10"
        contentContainerStyle={{ paddingTop: insets.top + 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <Logo subtitle="Student housing in Cebu" />
        <Text className="mt-6 text-3xl font-extrabold text-foreground">
          Create your account
        </Text>
        <Text className="mt-2 text-sm text-muted-foreground">
          {isOwner
            ? "Sign up as an owner to post your rentals and chat with students."
            : "Sign up as a student to swipe and save places near your campus."}
        </Text>

        <View className="mt-5 flex-row gap-2 rounded-3xl bg-secondary p-1.5">
          {(["student", "owner"] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => {
                if (busy) return;
                setAccountType(t);
                setError(null);
              }}
              className={cn("flex-1 items-center rounded-2xl py-2.5", accountType === t && "bg-card")}
            >
              <Text className={cn("text-xs font-extrabold", accountType === t ? "text-primary" : "text-muted-foreground")}>
                {t === "student" ? "I'm a student" : "I'm an owner"}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="mt-5 gap-3">
          {error ? (
            <Text className="rounded-2xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
              {error}
            </Text>
          ) : null}

          <Field
            label="Full name"
            value={name}
            onChangeText={setName}
            placeholder="Juan Dela Cruz"
            autoCapitalize="words"
            autoComplete="name"
            editable={!busy}
          />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={!busy}
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            editable={!busy}
          />
          <Field
            label="Confirm password"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Type the password again"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            editable={!busy}
          />

          <Btn
            label={busy ? "Please wait..." : "Create account"}
            icon="arrow-forward"
            onPress={submitEmail}
            disabled={busy}
          />

          <View className="flex-row items-center gap-3">
            <View className="h-px flex-1 bg-border" />
            <Text className="text-[11px] font-semibold text-muted-foreground">
              or
            </Text>
            <View className="h-px flex-1 bg-border" />
          </View>

          <Btn
            label={isOwner ? "Sign up with Google as Owner" : "Sign up with Google"}
            variant="outline"
            onPress={submitGoogle}
            disabled={busy}
          />
        </View>

        <Pressable
          onPress={() => {
            if (!busy) router.replace("/login");
          }}
          className="mt-5 items-center active:opacity-70"
        >
          <Text className="text-xs text-muted-foreground">
            Already have an account?{" "}
            <Text className="font-extrabold text-primary">Sign in</Text>
          </Text>
        </Pressable>

        <Card className="mt-6 gap-2 bg-primary/5">
          <View className="flex-row items-center gap-2">
            <Icon
              name="shield-checkmark-outline"
              size={16}
              color={colors.primary}
            />
            <Text className="text-sm font-extrabold text-primary">
              {isOwner ? "Owners and students" : "Students and owners"}
            </Text>
          </View>
          <Text className="text-[11px] text-muted-foreground">
            Admin accounts are created by the project team and cannot be
            registered here. Owners can post rentals and reply to students;
            students never share their contact details with owners.
          </Text>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
