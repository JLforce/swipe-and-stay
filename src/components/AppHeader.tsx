import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors } from "../constants/brand";
import { useApp } from "../lib/store";
import { Icon, Logo } from "./kit";

/** Header used by both tab layouts. Students get a notification bell; admins get sign out. */
export function AppHeader({ title, admin }: { title: string; admin?: boolean }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { unreadCount, signOut } = useApp();

  return (
    <View
      style={{ paddingTop: insets.top + 8 }}
      className="flex-row items-center justify-between bg-background px-4 pb-3"
    >
      <View>
        <Logo subtitle={admin ? `Admin · ${title}` : title} />
      </View>
      {admin ? (
        <Pressable
          onPress={() => {
            signOut();
            router.replace("/login");
          }}
          accessibilityLabel="Sign out"
          className="h-10 w-10 items-center justify-center rounded-full border border-border bg-card active:opacity-70"
        >
          <Icon name="log-out-outline" size={18} />
        </Pressable>
      ) : (
        <Pressable
          onPress={() => router.push("/notifications")}
          accessibilityLabel="Notifications"
          className="h-10 w-10 items-center justify-center rounded-full border border-border bg-card active:opacity-70"
        >
          <Icon name="notifications-outline" size={18} />
          {unreadCount > 0 ? (
            <View className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-accent" />
          ) : null}
        </Pressable>
      )}
    </View>
  );
}

export function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <View className="flex-row items-center justify-between border-b border-border bg-background px-5 py-4">
      <Text className="flex-1 pr-3 text-base font-extrabold text-foreground" numberOfLines={1}>
        {title}
      </Text>
      <Pressable
        onPress={onClose}
        accessibilityLabel="Close"
        className="h-9 w-9 items-center justify-center rounded-full bg-secondary active:opacity-70"
      >
        <Icon name="close" size={18} color={colors.secondaryForeground} />
      </Pressable>
    </View>
  );
}
