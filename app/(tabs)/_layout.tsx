// app/(tabs)/_layout.tsx
// Defines the bottom tab bar for the six main screens using Expo Router's
// file-based tabs. Icons use Feather (via @expo/vector-icons) instead of
// emoji so the bar reads as a real navigation control, not a sticker strip.

import React from "react";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAppTheme } from "../../context/ThemeContext";

type IconName = React.ComponentProps<typeof Feather>["name"];

function TabIcon({ name, color }: { name: IconName; color: string }) {
  return <Feather name={name} size={20} color={color} />;
}

export default function TabsLayout() {
  const { theme } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.subtext,
        tabBarShowLabel: true,
        // Force icon-above-label stacking explicitly. Without this, 6 tabs
        // on a narrow phone width can cause React Navigation to compress
        // the item and render the icon and label overlapping instead of
        // stacked, since there isn't enough width for a side-by-side layout.
        tabBarLabelPosition: "below-icon",
        tabBarAllowFontScaling: false,
        tabBarItemStyle: {
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 4,
          gap: 2,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 0,
        },
        tabBarStyle: {
          backgroundColor: theme.surfaceAlt,
          borderTopColor: theme.border,
          height: 78,
          paddingTop: 8,
          paddingBottom: 16,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarIcon: ({ color }) => <TabIcon name="home" color={color} /> }}
      />
      <Tabs.Screen
        name="workout"
        options={{ title: "Workout", tabBarIcon: ({ color }) => <TabIcon name="activity" color={color} /> }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{ title: "Nutrition", tabBarIcon: ({ color }) => <TabIcon name="coffee" color={color} /> }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: "Progress", tabBarIcon: ({ color }) => <TabIcon name="trending-up" color={color} /> }}
      />
      <Tabs.Screen
        name="achievements"
        options={{ title: "Awards", tabBarIcon: ({ color }) => <TabIcon name="award" color={color} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: "Settings", tabBarIcon: ({ color }) => <TabIcon name="settings" color={color} /> }}
      />
    </Tabs>
  );
}
