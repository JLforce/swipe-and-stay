import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing Supabase settings. Copy .env.example to .env, fill in your values, then restart with: npx expo start -c",
  );
}

// true while Expo Router renders the web build on Node (no window there)
const isServer = typeof window === "undefined";

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: isServer ? undefined : AsyncStorage, // keeps the user signed in between launches
    autoRefreshToken: !isServer,
    persistSession: !isServer,
    detectSessionInUrl: false, // required in React Native
  },
});
