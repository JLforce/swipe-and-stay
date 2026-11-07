import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/brand";
import { cn } from "../lib/cn";
import { toGradient } from "../lib/gradient";

export type IconName = React.ComponentProps<typeof Ionicons>["name"];

export function Icon({ name, size = 16, color = colors.foreground }: { name: IconName; size?: number; color?: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}

const TONES = {
  muted: { box: "bg-secondary", text: "text-secondary-foreground", icon: colors.secondaryForeground },
  primary: { box: "bg-primary/10", text: "text-primary", icon: colors.primary },
  accent: { box: "bg-accent/15", text: "text-accent", icon: colors.accent },
  danger: { box: "bg-destructive/10", text: "text-destructive", icon: colors.destructive },
} as const;

export function Tag({
  children,
  tone = "muted",
  icon,
}: {
  children: ReactNode;
  tone?: keyof typeof TONES;
  icon?: IconName;
}) {
  const t = TONES[tone];
  return (
    <View className={cn("flex-row items-center gap-1 self-start rounded-full px-2.5 py-1", t.box)}>
      {icon ? <Icon name={icon} size={12} color={t.icon} /> : null}
      <Text className={cn("text-[11px] font-semibold", t.text)}>{children}</Text>
    </View>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={cn("rounded-3xl border border-border bg-card p-4", className)}>{children}</View>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Text className="mb-2 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">{children}</Text>
  );
}

export function Photo({
  gradient,
  className,
  label,
}: {
  gradient: string;
  className?: string;
  label?: string;
}) {
  return (
    <View className={cn("overflow-hidden", className)}>
      <LinearGradient
        colors={toGradient(gradient)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.45)"]}
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "50%" }}
      />
      {label ? (
        <Text className="absolute bottom-2 left-3 text-[11px] font-semibold text-primary-foreground/90">{label}</Text>
      ) : null}
    </View>
  );
}

export function Meter({ value, tone = "primary" }: { value: number; tone?: "primary" | "accent" }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View className="h-2 w-full overflow-hidden rounded-full bg-secondary">
      <View className={cn("h-full rounded-full", tone === "primary" ? "bg-primary" : "bg-accent")} style={{ width: `${pct}%` }} />
    </View>
  );
}

const BTN = {
  primary: { box: "bg-primary", text: "text-primary-foreground", icon: colors.primaryForeground },
  outline: { box: "border border-border bg-card", text: "text-foreground", icon: colors.foreground },
  soft: { box: "bg-secondary", text: "text-primary", icon: colors.primary },
  danger: { box: "bg-destructive/10", text: "text-destructive", icon: colors.destructive },
} as const;

export function Btn({
  label,
  onPress,
  variant = "primary",
  icon,
  disabled,
  className,
}: {
  label: string;
  onPress?: () => void;
  variant?: keyof typeof BTN;
  icon?: IconName;
  disabled?: boolean;
  className?: string;
}) {
  const v = BTN[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={cn("flex-row items-center justify-center gap-2 rounded-2xl px-4 py-3.5 active:opacity-80", v.box, disabled && "opacity-50", className)}
    >
      {icon ? <Icon name={icon} size={16} color={v.icon} /> : null}
      <Text className={cn("text-sm font-extrabold", v.text)}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={cn("rounded-full border px-3.5 py-2 active:opacity-80", selected ? "border-primary bg-primary/10" : "border-border bg-card")}
    >
      <Text className={cn("text-xs font-bold", selected ? "text-primary" : "text-foreground")}>{label}</Text>
    </Pressable>
  );
}

export function Row({
  icon,
  label,
  hint,
  onPress,
}: {
  icon: IconName;
  label: string;
  hint?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 px-4 py-3.5 active:opacity-70">
      <View className="h-9 w-9 items-center justify-center rounded-2xl bg-secondary">
        <Icon name={icon} size={16} color={colors.secondaryForeground} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
          {label}
        </Text>
        {hint ? (
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {hint}
          </Text>
        ) : null}
      </View>
      <Icon name="chevron-forward" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

export function Logo({ subtitle }: { subtitle?: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <View className="h-9 w-9 items-center justify-center rounded-2xl bg-primary">
        <Icon name="sparkles" size={16} color={colors.primaryForeground} />
      </View>
      <View>
        <Text className="text-sm font-extrabold text-foreground">Swipe &amp; Stay</Text>
        {subtitle ? <Text className="text-[11px] text-muted-foreground">{subtitle}</Text> : null}
      </View>
    </View>
  );
}
