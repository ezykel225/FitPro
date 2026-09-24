// app/_layout.tsx
// Root layout for Expo Router. Wraps the entire app in ThemeProvider
// (global dark-mode context) and defines the root Stack, which hosts the
// (tabs) group and the first-run onboarding screen. New users are
// redirected to /onboarding until settings.onboardingComplete is true.
// The opening intro (SplashIntro) is drawn on top while the app loads underneath.

import React, { useState } from "react";
import { Stack, Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { ThemeProvider, useAppTheme } from "../context/ThemeContext";
import SplashIntro from "../components/SplashIntro";

function RootStack() {
  const { isDark, theme, settings, settingsLoading } = useAppTheme();

  if (settingsLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  if (!settings.onboardingComplete) {
    return (
      <>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
        </Stack>
        <Redirect href="/onboarding" />
      </>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <ThemeProvider>
      <View style={{ flex: 1 }}>
        <RootStack />
        {showIntro ? <SplashIntro onFinish={() => setShowIntro(false)} /> : null}
      </View>
    </ThemeProvider>
  );
}
