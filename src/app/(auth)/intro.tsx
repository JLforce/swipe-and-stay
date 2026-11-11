import { useState } from "react";
import { Image, Pressable, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Btn, Logo, Tag } from "../../components/kit";
import { colors } from "../../constants/brand";
import { ONBOARDING_SLIDES } from "../../data/mockData";
import { cn } from "../../lib/cn";

// One illustration per slide, in the same order as ONBOARDING_SLIDES.
const ART = [
  require("../../../assets/images/intro-discover.png"),
  require("../../../assets/images/intro-matching.png"),
  require("../../../assets/images/intro-safety.png"),
];

export default function Intro() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  // Tall phones get the full 340pt picture; short phones get a smaller one so nothing is cut off.
  const artHeight = Math.min(340, Math.round(height * 0.38));
  const [step, setStep] = useState(0);
  const slide = ONBOARDING_SLIDES[step]!;
  const last = step === ONBOARDING_SLIDES.length - 1;

  return (
    <View className="flex-1 bg-background px-6" style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}>
      <Logo subtitle="Student housing in Cebu" />
      <View className="mt-6 flex-1">
        <Image
          source={ART[step]!}
          resizeMode="contain"
          style={{ width: "100%", height: artHeight }}
          accessibilityLabel={`${slide.title} illustration`}
        />
        <View className="mt-5">
          <Tag tone="accent">{slide.tag}</Tag>
        </View>
        <Text className="mt-3 text-3xl font-extrabold leading-9 text-foreground">{slide.title}</Text>
        <Text className="mt-3 text-base leading-6 text-muted-foreground">{slide.body}</Text>
      </View>

      <View className="gap-4">
        <View className="flex-row justify-center gap-1.5">
          {ONBOARDING_SLIDES.map((_, i) => (
            <View key={i} className={cn("h-1.5 rounded-full", i === step ? "w-6 bg-primary" : "w-1.5 bg-border")} />
          ))}
        </View>
        <Btn label={last ? "Get started" : "Next"} icon="arrow-forward" onPress={() => (last ? router.replace("/login") : setStep(step + 1))} />
        <Pressable onPress={() => router.replace("/login")}>
          <Text className="text-center text-xs font-semibold" style={{ color: colors.mutedForeground }}>
            Skip intro
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
