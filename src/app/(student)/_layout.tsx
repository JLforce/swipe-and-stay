import { Redirect, Tabs } from "expo-router";
import type { ColorValue } from "react-native";
import { ActivityIndicator, View } from "react-native";
import { AppHeader } from "../../components/AppHeader";
import { Icon, type IconName } from "../../components/kit";
import { colors } from "../../constants/brand";
import { useApp } from "../../lib/store";

const tabIcon = (on: IconName, off: IconName) =>
  function TabIcon({
    focused,
    color,
  }: {
    focused: boolean;
    color: ColorValue;
  }) {
    return <Icon name={focused ? on : off} size={22} color={color as string} />;
  };

export default function StudentLayout() {
  const { account, authLoading, onboarded } = useApp();

  // Wait for the session check so a reload does not bounce a signed-in student.
  if (authLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!account) return <Redirect href="/login" />;
  if (account.role === "admin") return <Redirect href="/overview" />;
  if (!onboarded) return <Redirect href="/setup" />;

  return (
    <Tabs
      screenOptions={{
        header: ({ options }) => (
          <AppHeader title={String(options.title ?? "")} />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontWeight: "700", fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: tabIcon("compass", "compass-outline"),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: tabIcon("search", "search-outline"),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          tabBarIcon: tabIcon("bookmark", "bookmark-outline"),
        }}
      />
      <Tabs.Screen
        name="lease"
        options={{
          title: "Lease",
          tabBarIcon: tabIcon("document-text", "document-text-outline"),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: tabIcon("person", "person-outline"),
        }}
      />
    </Tabs>
  );
}
