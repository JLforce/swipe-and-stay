import { ScrollView, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Redirect, useRouter } from "expo-router";
import { Logo } from "../../components/kit";
import { PreferenceForm } from "../../components/PreferenceForm";
import { useApp } from "../../lib/store";

export default function Setup() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { account, prefs, savePrefs, flash } = useApp();
  if (!account) return <Redirect href="/login" />;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-6 pb-12"
      contentContainerStyle={{ paddingTop: insets.top + 16 }}
    >
      <Logo subtitle="Set up your preferences" />
      <Text className="mt-6 text-3xl font-extrabold text-foreground">What are you looking for?</Text>
      <Text className="mb-6 mt-2 text-sm text-muted-foreground">
        This takes about a minute. You can change it any time from your Profile.
      </Text>
      <PreferenceForm
        initial={prefs}
        submitLabel="Start swiping"
        onSubmit={(p) => {
          savePrefs(p);
          flash("Preferences saved");
          router.replace("/discover");
        }}
      />
    </ScrollView>
  );
}
