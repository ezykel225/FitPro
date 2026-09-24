// components/SplashIntro.tsx
// Opening screen shown on every launch: logo, name, tagline, and a loading
// bar with rotating fitness lines, then a fade into the app. Tap to skip.
//
// On web, scripts/pwa.js puts an identical static version of this screen in
// index.html, so it's visible while the JS bundle downloads and this component
// takes over without a visible jump. Keep the two in sync.

import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Rect } from "react-native-svg";

export const SPLASH_COLORS = {
  background: "#0B0F19",
  gradient: ["#3B82F6", "#22D3EE"] as const,
  text: "#F9FAFB",
  subtext: "#9CA3AF",
  track: "#1F2937",
};

const LINES = ["Warming up…", "Loading your PPL plan…", "Checking this week's targets…", "Let's get it 💪"];
const DURATION_MS = 2000;
const FADE_MS = 350;

/** Dumbbell mark - same shapes as the SVG in scripts/pwa.js. */
export function DumbbellMark({ size = 52, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Rect x={18} y={29} width={28} height={6} rx={3} fill={color} />
      <Rect x={12} y={18} width={8} height={28} rx={3} fill={color} />
      <Rect x={44} y={18} width={8} height={28} rx={3} fill={color} />
      <Rect x={5} y={23} width={7} height={18} rx={3} fill={color} />
      <Rect x={52} y={23} width={7} height={18} rx={3} fill={color} />
    </Svg>
  );
}

export default function SplashIntro({ onFinish }: { onFinish: () => void }) {
  const progress = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const [lineIndex, setLineIndex] = useState(0);
  const finished = useRef(false);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    Animated.timing(opacity, {
      toValue: 0,
      duration: FADE_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start(() => onFinish());
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ])
    ).start();

    Animated.timing(progress, {
      toValue: 1,
      duration: DURATION_MS,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished: done }) => done && finish());

    const interval = setInterval(
      () => setLineIndex((i) => Math.min(i + 1, LINES.length - 1)),
      DURATION_MS / LINES.length
    );
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity }]}>
      <Pressable style={styles.center} onPress={finish} accessibilityLabel="Skip intro">
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <LinearGradient colors={SPLASH_COLORS.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logo}>
            <DumbbellMark />
          </LinearGradient>
        </Animated.View>

        <Text style={styles.name}>FitPro</Text>
        <Text style={styles.tagline}>THE LAZY FITNESS ASSISTANT</Text>

        <View style={styles.footer}>
          <View style={styles.track}>
            <Animated.View style={[styles.fill, { width: barWidth }]}>
              <LinearGradient
                colors={SPLASH_COLORS.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
          <Text style={styles.line}>{LINES[lineIndex]}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: SPLASH_COLORS.background, zIndex: 1000 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  logo: {
    width: 104,
    height: 104,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3B82F6",
    shadowOpacity: 0.55,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
  },
  name: { color: SPLASH_COLORS.text, fontSize: 44, fontWeight: "900", marginTop: 28, letterSpacing: -1 },
  tagline: { color: SPLASH_COLORS.subtext, fontSize: 12, fontWeight: "700", letterSpacing: 3, marginTop: 6 },
  footer: { position: "absolute", bottom: 90, alignItems: "center" },
  track: { width: 180, height: 4, borderRadius: 2, backgroundColor: SPLASH_COLORS.track, overflow: "hidden" },
  fill: { height: 4, borderRadius: 2, overflow: "hidden" },
  line: { color: SPLASH_COLORS.subtext, fontSize: 13, marginTop: 14 },
});
