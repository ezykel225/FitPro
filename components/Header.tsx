// components/Header.tsx
// Reusable header shown at the top of every screen.
// Keeps title/subtitle styling consistent app-wide.

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAppTheme } from "../context/ThemeContext";
import { spacing } from "../constants/theme";

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
}

export default function Header({ title, subtitle, rightSlot }: HeaderProps) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.row}>
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.subtext }]}>{subtitle}</Text>
        ) : null}
      </View>
      {rightSlot ? <View>{rightSlot}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  textBlock: {
    flexShrink: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
});
