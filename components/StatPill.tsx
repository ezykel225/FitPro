// components/StatPill.tsx
// A stat block with a colored icon badge (not an emoji in a plain box).
// The badge color itself communicates what kind of stat it is:
// blue = motivation/streak, amber = calories, mint = completion.

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAppTheme } from "../context/ThemeContext";
import { spacing, radius } from "../constants/theme";

interface StatPillProps {
  icon: React.ComponentProps<typeof Feather>["name"];
  accentColor: string;
  value: string | number;
  label: string;
}

export default function StatPill({ icon, accentColor, value, label }: StatPillProps) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.pill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.badge, { backgroundColor: `${accentColor}1F` }]}>
        <Feather name={icon} size={18} color={accentColor} />
      </View>
      <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.label, { color: theme.subtext }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginHorizontal: 4,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  value: {
    fontSize: 18,
    fontWeight: "800",
  },
  label: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: "500",
  },
});
