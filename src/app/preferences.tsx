import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { ModalHeader } from "../components/AppHeader";
import { PreferenceForm } from "../components/PreferenceForm";
import { useApp } from "../lib/store";

export default function Preferences() {
  const router = useRouter();
  const { prefs, savePrefs, flash } = useApp();
  return (
    <View className="flex-1 bg-background">
      <ModalHeader title="Edit preferences" onClose={() => router.back()} />
      <ScrollView contentContainerClassName="p-5 pb-12">
        <PreferenceForm
          initial={prefs}
          submitLabel="Save preferences"
          onSubmit={(p) => {
            savePrefs(p);
            flash("Preferences saved");
            router.back();
          }}
        />
      </ScrollView>
    </View>
  );
}
