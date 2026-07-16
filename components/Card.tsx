// components/Card.tsx
// A generic elevated container used everywhere (Home, Workout, Nutrition,
// Progress, Achievements) so surfaces look consistent across the app.

import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { useAppTheme } from "../context/ThemeContext";
import { spacing, radius } from "../constants/theme";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function Card({ children, style }: CardProps) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
    // subtle shadow (iOS) + elevation (Android)
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
