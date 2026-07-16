// hooks/useSettings.ts
// Manages app-level settings (dark mode, notifications) and exposes
// the "reset all data" action used by the Settings screen.

import { useState, useEffect, useCallback } from "react";
import { AppSettings } from "../constants/types";
import { getItem, setItem, resetAllData, STORAGE_KEYS } from "../services/storage";

const DEFAULT_SETTINGS: AppSettings = {
  darkMode: true,
  notificationsEnabled: true,
  onboardingComplete: false,
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = await getItem<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
      setSettings(saved);
      setLoading(false);
    })();
  }, []);

  const toggleDarkMode = useCallback(async () => {
    const next = { ...settings, darkMode: !settings.darkMode };
    setSettings(next);
    await setItem(STORAGE_KEYS.SETTINGS, next);
  }, [settings]);

  const toggleNotifications = useCallback(async () => {
    const next = { ...settings, notificationsEnabled: !settings.notificationsEnabled };
    setSettings(next);
    await setItem(STORAGE_KEYS.SETTINGS, next);
  }, [settings]);

  const resetData = useCallback(async () => {
    await resetAllData();
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const completeOnboarding = useCallback(async () => {
    const next = { ...settings, onboardingComplete: true };
    setSettings(next);
    await setItem(STORAGE_KEYS.SETTINGS, next);
  }, [settings]);

  return {
    loading,
    settings,
    toggleDarkMode,
    toggleNotifications,
    resetData,
    completeOnboarding,
  };
}
