import "../global.css";
import { useCallback, useState } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AnimatedSplash } from "../components/AnimatedSplash";
import { Toast } from "../components/Toast";
import { colors } from "../constants/brand";
import { AppProvider } from "../lib/store";

// Keep the native splash up until our animated splash has painted (see AnimatedSplash).
SplashScreen.preventAutoHideAsync().catch(() => undefined);
SplashScreen.setOptions({ duration: 250, fade: true });

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);
  const finishSplash = useCallback(() => setSplashDone(true), []);

  return (
    <SafeAreaProvider>
      <AppProvider>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <StatusBar style={splashDone ? "dark" : "light"} />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
            <Stack.Screen name="listing/[id]" options={{ presentation: "modal" }} />
            <Stack.Screen name="match/[id]" options={{ presentation: "modal" }} />
            <Stack.Screen
              name="notifications"
              options={{ presentation: "transparentModal", animation: "slide_from_bottom", contentStyle: { backgroundColor: "transparent" } }}
            />
            <Stack.Screen name="preferences" options={{ presentation: "modal" }} />
            <Stack.Screen name="chat/[id]" options={{ presentation: "modal" }} />
            <Stack.Screen name="messages" options={{ presentation: "modal" }} />
          </Stack>
          <Toast />
          {splashDone ? null : <AnimatedSplash onFinish={finishSplash} />}
        </View>
      </AppProvider>
    </SafeAreaProvider>
  );
}
