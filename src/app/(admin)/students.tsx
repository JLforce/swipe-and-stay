import { ScrollView, Text, View } from "react-native";
import { Card, Icon } from "../../components/kit";
import { colors } from "../../constants/brand";

export default function Students() {
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-3 px-4 pb-10"
    >
      <Card className="gap-2 bg-primary/5">
        <View className="flex-row items-center gap-2">
          <Icon
            name="shield-checkmark-outline"
            size={16}
            color={colors.primary}
          />
          <Text className="text-sm font-extrabold text-primary">
            Student accounts are private
          </Text>
        </View>
        <Text className="text-[11px] text-muted-foreground">
          The student list is not shown yet. Admins cannot read other
          people&apos;s profiles, and the project team still has to decide
          whether to allow it and which details would be shared.
        </Text>
      </Card>
    </ScrollView>
  );
}
