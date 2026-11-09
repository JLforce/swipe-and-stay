import { useImperativeHandle, useState, type Ref } from "react";
import { Animated, Dimensions, PanResponder, Text, View } from "react-native";
import type { Prefs, Ranked, Weights } from "../lib/matching";
import { ListingCard } from "./ListingCard";
import { Photo } from "./kit";

export interface SwipeDeckHandle {
  swipe: (dir: "left" | "right") => void;
}

const SCREEN_W = Dimensions.get("window").width;
const THRESHOLD = 110;

export function SwipeDeck({
  current,
  next,
  prefs,
  weights,
  onSwipe,
  onOpen,
  ref,
}: {
  current: Ranked;
  next?: Ranked;
  prefs: Prefs;
  weights: Weights;
  onSwipe: (dir: "left" | "right", item: Ranked) => void;
  onOpen: (item: Ranked) => void;
  ref?: Ref<SwipeDeckHandle>;
}) {
  // The parent gives every card its own SwipeDeck (key = listing id), so this engine is created
  // fresh for each card and can safely capture that card and the handler once.
  const [engine] = useState(() => {
    const pan = new Animated.ValueXY();
    const fling = (dir: "left" | "right") => {
      Animated.timing(pan, {
        toValue: { x: dir === "right" ? SCREEN_W * 1.3 : -SCREEN_W * 1.3, y: 0 },
        duration: 200,
        useNativeDriver: false,
      }).start(() => onSwipe(dir, current));
    };
    const responder = PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        if (g.dx > THRESHOLD) fling("right");
        else if (g.dx < -THRESHOLD) fling("left");
        else Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
      },
    });
    return { pan, fling, responder };
  });
  const { pan, fling, responder } = engine;

  useImperativeHandle(ref, () => ({ swipe: fling }), [fling]);

  const rotate = pan.x.interpolate({ inputRange: [-200, 0, 200], outputRange: ["-10deg", "0deg", "10deg"] });
  const likeOpacity = pan.x.interpolate({ inputRange: [0, 100], outputRange: [0, 1], extrapolate: "clamp" });
  const passOpacity = pan.x.interpolate({ inputRange: [-100, 0], outputRange: [1, 0], extrapolate: "clamp" });

  return (
    <View className="h-[430px]">
      {next ? (
        <View className="absolute inset-x-3 top-3 h-full overflow-hidden rounded-[32px] border border-border bg-card opacity-70">
          <Photo gradient={next.listing.photo} className="h-full w-full" />
        </View>
      ) : null}
      <Animated.View
        {...responder.panHandlers}
        style={{ flex: 1, transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] }}
      >
        <ListingCard item={current} prefs={prefs} weights={weights} onPress={() => onOpen(current)} />
        <Animated.View
          pointerEvents="none"
          style={{ opacity: likeOpacity }}
          className="absolute left-5 top-5 rounded-xl border-2 border-primary bg-background/90 px-3 py-1"
        >
          <Text className="text-lg font-extrabold text-primary">LIKE</Text>
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={{ opacity: passOpacity }}
          className="absolute right-5 top-5 rounded-xl border-2 border-destructive bg-background/90 px-3 py-1"
        >
          <Text className="text-lg font-extrabold text-destructive">PASS</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
