import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toast } from "../components/Toast";
import { colors } from "../constants/brand";
import { AppProvider } from "../lib/store";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
            <Stack.Screen name="listing/[id]" options={{ presentation: "modal" }} />
            <Stack.Screen name="match/[id]" options={{ presentation: "modal" }} />
            <Stack.Screen name="notifications" options={{ presentation: "modal" }} />
            <Stack.Screen name="preferences" options={{ presentation: "modal" }} />
          </Stack>
          <Toast />
        </View>
      </AppProvider>
    </SafeAreaProvider>
  );
}
