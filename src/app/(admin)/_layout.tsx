import type { ColorValue } from "react-native";
import { Redirect, Tabs } from "expo-router";
import { AppHeader } from "../../components/AppHeader";
import { Icon, type IconName } from "../../components/kit";
import { colors } from "../../constants/brand";
import { useApp } from "../../lib/store";

const tabIcon = (on: IconName, off: IconName) =>
  function TabIcon({ focused, color }: { focused: boolean; color: ColorValue }) {
    return <Icon name={focused ? on : off} size={22} color={color as string} />;
  };

export default function AdminLayout() {
  const { account } = useApp();
  if (!account) return <Redirect href="/login" />;
  if (account.role !== "admin") return <Redirect href="/discover" />;

  return (
    <Tabs
      screenOptions={{
        header: ({ options }) => <AppHeader admin title={String(options.title ?? "")} />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarLabelStyle: { fontWeight: "700", fontSize: 11 },
      }}
    >
      <Tabs.Screen name="overview" options={{ title: "Overview", tabBarIcon: tabIcon("grid", "grid-outline") }} />
      <Tabs.Screen name="listings" options={{ title: "Listings", tabBarIcon: tabIcon("business", "business-outline") }} />
      <Tabs.Screen name="students" options={{ title: "Students", tabBarIcon: tabIcon("people", "people-outline") }} />
    </Tabs>
  );
}
