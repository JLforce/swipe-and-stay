import { Redirect, Stack, useSegments } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { colors } from "../../constants/brand";
import { useApp } from "../../lib/store";

export default function AuthLayout() {
  const { account, authLoading, onboarded } = useApp();
  const segments = useSegments();
  const current = String(segments[segments.length - 1] ?? "");

  // Onboarding is only for a signed-in student who has not finished it.
  // Intro, login and signup stay open on purpose, so a sign-in error
  // (for example a role mismatch) is never hidden by a redirect.
  if (current === "setup") {
    if (authLoading) {
      return (
        <View className="flex-1 items-center justify-center bg-background">
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }
    if (!account) return <Redirect href="/login" />;
    if (account.role === "admin") return <Redirect href="/overview" />;
    if (onboarded) return <Redirect href="/discover" />;
  }

  return <Stack screenOptions={{ headerShown: false, animation: "fade" }} />;
}
