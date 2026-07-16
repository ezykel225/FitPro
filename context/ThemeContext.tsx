// context/ThemeContext.tsx
// Provides the current color theme (light/dark) to every screen via
// React Context, so components don't need to prop-drill theme values.
// Wraps useSettings so toggling dark mode in Settings updates the
// whole app instantly.

import React, { createContext, useContext, useMemo } from "react";
import { lightTheme, darkTheme, Theme } from "../constants/theme";
import { useSettings } from "../hooks/useSettings";
import { AppSettings } from "../constants/types";

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleDarkMode: () => void;
  toggleNotifications: () => void;
  settingsLoading: boolean;
  settings: AppSettings;
  completeOnboarding: () => Promise<void>;
  resetData: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings, toggleDarkMode, toggleNotifications, loading, completeOnboarding, resetData } = useSettings();

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: settings.darkMode ? darkTheme : lightTheme,
      isDark: settings.darkMode,
      toggleDarkMode,
      toggleNotifications,
      settingsLoading: loading,
      settings,
      completeOnboarding,
      resetData,
    }),
    [settings, toggleDarkMode, toggleNotifications, loading, completeOnboarding, resetData]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Convenience hook: const { theme } = useAppTheme(); */
export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useAppTheme must be used within a ThemeProvider");
  }
  return ctx;
}
