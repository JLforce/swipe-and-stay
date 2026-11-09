import { Redirect, type Href } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { colors } from "../constants/brand";
import { useApp } from "../lib/store";

// Change these four if your route names differ.
const ROUTES: Record<
  "intro" | "onboarding" | "studentHome" | "adminHome",
  Href
> = {
  intro: "/intro",
  onboarding: "/setup",
  studentHome: "/discover",
  adminHome: "/overview",
};

export default function Index() {
  const { account, authLoading, onboarded } = useApp();

  // Wait for the saved session to be checked before deciding where to go.
  if (authLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!account) return <Redirect href={ROUTES.intro} />;
  if (account.role === "admin") return <Redirect href={ROUTES.adminHome} />;
  return <Redirect href={onboarded ? ROUTES.studentHome : ROUTES.onboarding} />;
}
