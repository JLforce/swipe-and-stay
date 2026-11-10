import type { ColorValue } from "react-native";
import { Redirect, Tabs } from "expo-router";
import { AppHeader } from "../../components/AppHeader";
import { Icon, type IconName } from "../../components/kit";
import { colors } from "../../constants/brand";
import { OwnerProvider, useOwner } from "../../lib/owner";
import { useApp } from "../../lib/store";

const tabIcon = (on: IconName, off: IconName) =>
  function TabIcon({ focused, color }: { focused: boolean; color: ColorValue }) {
    return <Icon name={focused ? on : off} size={22} color={color as string} />;
  };

function OwnerTabs() {
  const { stats } = useOwner();

  return (
    <Tabs
      screenOptions={{
        header: ({ options }) => <AppHeader owner title={String(options.title ?? "")} />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarLabelStyle: { fontWeight: "700", fontSize: 11 },
      }}
    >
      <Tabs.Screen name="my-listings" options={{ title: "Listings", tabBarIcon: tabIcon("business", "business-outline") }} />
      <Tabs.Screen name="interested" options={{ title: "Students", tabBarIcon: tabIcon("people", "people-outline") }} />
      <Tabs.Screen
        name="inquiries"
        options={{
          title: "Inquiries",
          tabBarIcon: tabIcon("chatbubbles", "chatbubbles-outline"),
          tabBarBadge: stats.newInquiries > 0 ? stats.newInquiries : undefined,
        }}
      />
    </Tabs>
  );
}

export default function OwnerLayout() {
  const { account } = useApp();
  if (!account) return <Redirect href="/login" />;
  // The root screen sends each role to its own home.
  if (account.role !== "owner") return <Redirect href="/" />;

  return (
    <OwnerProvider>
      <OwnerTabs />
    </OwnerProvider>
  );
}
