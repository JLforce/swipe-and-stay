import { useSyncExternalStore } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";

// false during server render / first paint, true once running in the browser
const subscribe = () => () => {};
function useHasHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true, // client value
    () => false, // server value
  );
}

export function useColorScheme() {
  const hasHydrated = useHasHydrated();
  const colorScheme = useRNColorScheme();

  // Before hydration always return 'light' so server and client output match.
  return hasHydrated ? colorScheme : "light";
}
