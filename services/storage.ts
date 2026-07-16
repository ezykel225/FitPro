// services/storage.ts
// A thin, typed wrapper around AsyncStorage.
// Every hook in /hooks reads and writes through this file instead of
// calling AsyncStorage directly. This keeps storage keys in one place
// and makes it easy to swap the backend later (e.g. to a real API)
// without touching component/hook code.

import AsyncStorage from "@react-native-async-storage/async-storage";

export const STORAGE_KEYS = {
  WORKOUT_DAYS: "fitpro:workoutDays",
  WORKOUT_LOG: "fitpro:workoutLog",
  MEALS: "fitpro:meals",
  NUTRITION_GOALS: "fitpro:nutritionGoals",
  WEIGHT_LOG: "fitpro:weightLog",
  BADGES: "fitpro:badges",
  PROFILE: "fitpro:profile",
  SETTINGS: "fitpro:settings",
  STREAK: "fitpro:streak",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * Reads and JSON-parses a value from AsyncStorage.
 * Returns `fallback` if the key doesn't exist or parsing fails,
 * so callers never have to null-check everywhere.
 */
export async function getItem<T>(key: StorageKey, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`[storage] Failed to read ${key}:`, error);
    return fallback;
  }
}

/**
 * JSON-stringifies and writes a value to AsyncStorage.
 * Errors are caught and logged rather than thrown, so a failed
 * write never crashes the UI - the in-memory state still updates.
 */
export async function setItem<T>(key: StorageKey, value: T): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`[storage] Failed to write ${key}:`, error);
    return false;
  }
}

/** Removes a single key (used by "Reset data" in Settings). */
export async function removeItem(key: StorageKey): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn(`[storage] Failed to remove ${key}:`, error);
  }
}

/** Wipes every FitPro key. Used by the "Reset all data" settings action. */
export async function resetAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch (error) {
    console.warn("[storage] Failed to reset all data:", error);
  }
}
