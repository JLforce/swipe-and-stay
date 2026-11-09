import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { completeSignInFromUrl, parseRole } from "../../lib/auth";

// Google sends the browser back here after sign-in.
// On web, this screen finishes the sign-in once, then goes home.
// On native, sign-in is finished inside signInWithGoogle(), so we just go home.
export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web") {
      router.replace("/");
      return;
    }

    let active = true;

    const url = window.location.href;
    const mode = parseRole(new URL(url).searchParams.get("mode"));

    completeSignInFromUrl(url, mode)
      .then(() => {
        if (active) router.replace("/");
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Google sign-in failed.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, [router]);

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          gap: 16,
        }}
      >
        <Text style={{ fontSize: 16, textAlign: "center", color: "#b91c1c" }}>
          {error}
        </Text>
        <Pressable
          onPress={() => router.replace("/login")}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 12,
            backgroundColor: "#111827",
          }}
        >
          <Text style={{ color: "#ffffff", fontWeight: "600" }}>
            Back to sign in
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
      }}
    >
      <ActivityIndicator />
      <Text>Signing you in...</Text>
    </View>
  );
}
