import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ModalHeader } from "../components/AppHeader";
import { Card, Icon, type IconName } from "../components/kit";
import { colors } from "../constants/brand";
import { cn } from "../lib/cn";
import { useApp } from "../lib/store";

const ICON: Record<string, { name: IconName; color: string }> = {
  match: { name: "sparkles", color: colors.primary },
  deactivated: { name: "warning-outline", color: colors.destructive },
  info: { name: "information-circle-outline", color: colors.accent },
};

export default function Notifications() {
  const router = useRouter();
  const { notifications, markAllRead } = useApp();
  // Snapshot so unread items stay highlighted while this screen is open.
  const [shown] = useState(notifications);
  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  return (
    <View className="flex-1 bg-background">
      <ModalHeader title="Notifications" onClose={() => router.back()} />
      <ScrollView contentContainerClassName="gap-3 p-5 pb-12">
        {shown.map((n) => {
          const ic = ICON[n.kind]!;
          return (
            <Card key={n.id} className={cn("flex-row gap-3", n.kind === "deactivated" && "border-destructive/30 bg-destructive/5", !n.read && "border-primary/40")}>
              <View className="h-9 w-9 items-center justify-center rounded-2xl bg-secondary">
                <Icon name={ic.name} size={16} color={ic.color} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-foreground">{n.title}</Text>
                <Text className="mt-0.5 text-sm text-foreground/75">{n.body}</Text>
                <Text className="mt-1 text-[11px] text-muted-foreground">{n.time}</Text>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}
