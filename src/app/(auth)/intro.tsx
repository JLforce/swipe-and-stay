import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Btn, Logo, Photo, Tag } from "../../components/kit";
import { colors } from "../../constants/brand";
import { ONBOARDING_SLIDES } from "../../data/mockData";
import { cn } from "../../lib/cn";

export default function Intro() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const slide = ONBOARDING_SLIDES[step]!;
  const last = step === ONBOARDING_SLIDES.length - 1;

  return (
    <View className="flex-1 bg-background px-6" style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}>
      <Logo subtitle="Student housing in Cebu" />
      <View className="mt-6 flex-1">
        <Photo gradient={slide.gradient} className="h-60 w-full rounded-[32px]" label="Illustration placeholder" />
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
