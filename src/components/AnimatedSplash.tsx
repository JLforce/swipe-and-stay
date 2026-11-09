import { useEffect, useState } from "react";
import { Animated, Dimensions, Easing, Platform, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";
import { colors } from "../constants/brand";

const NATIVE = Platform.OS !== "web";
const SIZE = Math.min(Dimensions.get("window").width * 0.66, 300);
// The badge sits at 776/1024 of the artwork, so it pops from that corner, not the centre.
const BADGE_ORIGIN = "75.8% 75.8%";

const art = {
  back: require("../../assets/images/splash-card-back.png"),
  front: require("../../assets/images/splash-card-front.png"),
  badge: require("../../assets/images/splash-badge.png"),
  wordmark: require("../../assets/images/splash-wordmark.png"),
};

/**
 * Opening animation (~2.4 s): the back card fans out, the front card drops in, the swipe badge
 * pops, the wordmark fades up, then the whole screen fades away to reveal the app.
 * The native splash (app.json) stays visible until this view has laid out, so there is no flash.
 */
export function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const [v] = useState(() => ({
    back: new Animated.Value(0),
    front: new Animated.Value(0),
    badge: new Animated.Value(0),
    word: new Animated.Value(0),
    out: new Animated.Value(1),
  }));

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    const timing = (value: Animated.Value, toValue: number, duration: number, delay = 0) =>
      Animated.timing(value, { toValue, duration, delay, easing: ease, useNativeDriver: NATIVE });

    const run = Animated.sequence([
      Animated.parallel([
        timing(v.back, 1, 450),
        timing(v.front, 1, 550, 150),
        Animated.spring(v.badge, { toValue: 1, friction: 5, tension: 150, delay: 520, useNativeDriver: NATIVE }),
        timing(v.word, 1, 450, 800),
      ]),
      Animated.delay(900),
      timing(v.out, 0, 350),
    ]);
    run.start(({ finished }) => {
      if (finished) onFinish();
    });
    return () => run.stop();
  }, [v, onFinish]);

  const backRot = v.back.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "12deg"] });
  const frontRot = v.front.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-6deg"] });
  const frontY = v.front.interpolate({ inputRange: [0, 1], outputRange: [-70, 0] });
  const frontScale = v.front.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });
  const wordY = v.word.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });

  return (
    <Animated.View
      style={[styles.root, { opacity: v.out }]}
      onLayout={() => {
        SplashScreen.hideAsync().catch(() => undefined);
      }}
    >
      <LinearGradient
        colors={["#12865F", colors.primary, "#074F3A"]}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ width: SIZE, height: SIZE }}>
        <Animated.Image
          source={art.back}
          style={[styles.layer, { opacity: v.back, transform: [{ rotate: backRot }] }]}
        />
        <Animated.Image
          source={art.front}
          style={[
            styles.layer,
            { opacity: v.front, transform: [{ translateY: frontY }, { rotate: frontRot }, { scale: frontScale }] },
          ]}
        />
        <Animated.Image
          source={art.badge}
          style={[styles.layer, { opacity: v.badge, transformOrigin: BADGE_ORIGIN, transform: [{ scale: v.badge }] }]}
        />
      </View>
      <Animated.Image
        source={art.wordmark}
        resizeMode="contain"
        style={{
          width: SIZE * 1.1,
          height: SIZE * 1.1 * (277 / 1088),
          marginTop: 24,
          opacity: v.word,
          transform: [{ translateY: wordY }],
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    zIndex: 100,
    elevation: 100,
  },
  layer: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" },
});
