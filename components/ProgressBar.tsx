// components/ProgressBar.tsx
// Reusable horizontal progress indicator, used for workout completion,
// nutrition goal progress, and weight-goal progress.

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAppTheme } from "../context/ThemeContext";
import { radius, spacing } from "../constants/theme";

interface ProgressBarProps {
  percent: number; // 0-100
  label?: string;
  color?: string;
}

export default function ProgressBar({ percent, label, color }: ProgressBarProps) {
  const { theme } = useAppTheme();
  const clamped = Math.max(0, Math.min(100, percent));
  const barColor = color ?? theme.primary;

  return (
    <View style={styles.wrapper}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: theme.subtext }]}>{label}</Text>
          <Text style={[styles.percent, { color: theme.text }]}>{clamped}%</Text>
        </View>
      ) : null}
      <View style={[styles.track, { backgroundColor: theme.border }]}>
        <View
          style={[
            styles.fill,
            { width: `${clamped}%`, backgroundColor: barColor },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.sm,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
  },
  percent: {
    fontSize: 13,
    fontWeight: "600",
  },
  track: {
    height: 10,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radius.pill,
  },
});
