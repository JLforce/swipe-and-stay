import { Redirect, Stack } from "expo-router";
import { OwnerProvider } from "../../lib/owner";
import { useApp } from "../../lib/store";

export default function OwnerLayout() {
  const { account } = useApp();
  if (!account) return <Redirect href="/login" />;
  // The root screen sends each role to its own home.
  if (account.role !== "owner") return <Redirect href="/" />;

  return (
    <OwnerProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </OwnerProvider>
  );
}
