import { Text, View } from "react-native";
import { useApp } from "../lib/store";

export function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <View pointerEvents="none" className="absolute bottom-28 left-0 right-0 items-center">
      <View className="rounded-full bg-foreground px-4 py-2">
        <Text className="text-xs font-bold text-background">{toast}</Text>
      </View>
    </View>
  );
}
