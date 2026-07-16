// components/Navigation.tsx
// Quick-action grid on the Home screen. Each tile uses a colored icon
// badge (Feather icons) instead of an emoji, so it reads as a real
// button rather than a sticker. Screen-to-screen tab navigation itself
// is handled by Expo Router - see app/(tabs)/_layout.tsx.

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAppTheme } from "../context/ThemeContext";
import { spacing, radius } from "../constants/theme";

interface QuickAction {
  label: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  color: string;
  route: "/workout" | "/nutrition" | "/progress" | "/achievements" | "/settings";
}

export default function Navigation() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const actions: QuickAction[] = [
    { label: "Start Workout", icon: "activity", color: theme.primary, route: "/workout" },
    { label: "Log Meal", icon: "coffee", color: theme.warning, route: "/nutrition" },
    { label: "Check Progress", icon: "trending-up", color: theme.info, route: "/progress" },
    { label: "Achievements", icon: "award", color: theme.success, route: "/achievements" },
  ];

  return (
    <View style={styles.grid}>
      {actions.map((action) => (
        <Pressable
          key={action.route}
          onPress={() => router.push(action.route)}
          style={({ pressed }) => [
            styles.tile,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <View style={[styles.iconBadge, { backgroundColor: `${action.color}1F` }]}>
            <Feather name={action.icon} size={20} color={action.color} />
          </View>
          <Text style={[styles.label, { color: theme.text }]}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  tile: {
    width: "48%",
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});
