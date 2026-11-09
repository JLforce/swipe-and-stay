import { useRouter } from "expo-router";
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
import { colors } from "../../constants/brand";
import { type Role } from "../../data/mockData";
import { signInWithEmail, signInWithGoogle } from "../../lib/auth";
import { cn } from "../../lib/cn";

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoComplete,
  editable,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoComplete?: "email" | "current-password";
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
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect={false}
        editable={editable}
        className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
      />
    </View>
  );
}

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitEmail() {
    if (busy) return; // ignore double taps
    setBusy(true);
    setError(null);
    try {
      await signInWithEmail(email, password, role);
      // The root screen sends the user to the right place.
      router.replace("/");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Sign in failed. Please try again.",
      );
      setBusy(false);
    }
  }

  async function submitGoogle() {
    if (busy) return; // ignore double taps while Google is open
    setBusy(true);
    setError(null);
    let redirecting = false;
    try {
      const account = await signInWithGoogle(role);
      if (account) {
        // Native: sign-in finished here. The root screen sends the user to the right place.
        router.replace("/");
      } else if (Platform.OS === "web") {
        // Web: the browser is leaving for Google, so keep the buttons disabled.
        redirecting = true;
      }
      // account === null on native means the user cancelled: no error to show.
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
          Sign in
        </Text>
        <Text className="mt-2 text-sm text-muted-foreground">
          Students swipe and save listings. The admin manages the listing pool.
        </Text>

        <View className="mt-5 flex-row gap-2 rounded-3xl bg-secondary p-1.5">
          {(["student", "admin"] as Role[]).map((r) => (
            <Pressable
              key={r}
              onPress={() => {
                if (busy) return;
                setRole(r);
                setError(null);
              }}
              className={cn(
                "flex-1 items-center rounded-2xl py-2.5",
                role === r && "bg-card",
              )}
            >
              <Text
                className={cn(
                  "text-xs font-extrabold",
                  role === r ? "text-primary" : "text-muted-foreground",
                )}
              >
                {r === "student" ? "Student" : "Admin"}
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
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoComplete="email"
            editable={!busy}
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secureTextEntry
            autoComplete="current-password"
            editable={!busy}
          />

          <Btn
            label={
              busy
                ? "Please wait..."
                : role === "student"
                  ? "Sign in as Student"
                  : "Sign in as Admin"
            }
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
            label={
              role === "student"
                ? "Continue with Google as Student"
                : "Continue with Google as Admin"
            }
            variant="outline"
            onPress={submitGoogle}
            disabled={busy}
          />
        </View>

        {role === "student" ? (
          <Pressable
            onPress={() => {
              if (!busy) router.replace("/signup");
            }}
            className="mt-5 items-center active:opacity-70"
          >
            <Text className="text-xs text-muted-foreground">
              New here?{" "}
              <Text className="font-extrabold text-primary">
                Create an account
              </Text>
            </Text>
          </Pressable>
        ) : null}

        <Card className="mt-6 gap-2 bg-primary/5">
          <View className="flex-row items-center gap-2">
            <Icon
              name="shield-checkmark-outline"
              size={16}
              color={colors.primary}
            />
            <Text className="text-sm font-extrabold text-primary">
              How accounts work
            </Text>
          </View>
          <Text className="text-[11px] text-muted-foreground">
            Students can sign up with an email and password or with Google.
            Admin accounts are created by the project team, and the Admin option
            only works for an account that has been given admin access.
          </Text>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
