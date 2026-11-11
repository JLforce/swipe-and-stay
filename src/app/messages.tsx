import { useRouter } from "expo-router";
import { View } from "react-native";
import { ModalHeader } from "../components/AppHeader";
import { ConversationList } from "../components/ConversationList";

// Student inbox: replies from owners about the places you asked about.
export default function Messages() {
  const router = useRouter();
  return (
    <View className="flex-1 bg-background">
      <ModalHeader title="Messages" onClose={() => router.back()} />
      <View className="h-3" />
      <ConversationList
        emptyText="No messages yet. Open a listing and tap “Message owner” to ask a question."
        actionLabel="Open"
      />
    </View>
  );
}
