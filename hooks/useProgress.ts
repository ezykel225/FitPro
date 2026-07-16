// hooks/useProgress.ts
// Manages body-weight log entries used by the Progress screen's line chart.

import { useState, useEffect, useCallback, useMemo } from "react";
import { WeightEntry, UserProfile } from "../constants/types";
import { getItem, setItem, STORAGE_KEYS } from "../services/storage";

const DEFAULT_PROFILE: UserProfile = {
  name: "Athlete",
  gender: "male",
  age: 25,
  goals: ["buildMuscle"],
  heightCm: 170,
  startingWeightKg: 70,
  targetWeightKg: 65,
  workoutsPerWeek: 3,
};

export function useProgress() {
  const [weightLog, setWeightLog] = useState<WeightEntry[]>([]);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [savedLog, savedProfile] = await Promise.all([
        getItem<WeightEntry[]>(STORAGE_KEYS.WEIGHT_LOG, []),
        getItem<UserProfile>(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE),
      ]);
      setWeightLog(savedLog);
      setProfile(savedProfile);
      setLoading(false);
    })();
  }, []);

  const addWeightEntry = useCallback(
    async (weightKg: number) => {
      const today = new Date().toISOString().split("T")[0];
      const next = [
        ...weightLog.filter((e) => e.date !== today),
        { date: today, weightKg },
      ].sort((a, b) => a.date.localeCompare(b.date));
      setWeightLog(next);
      await setItem(STORAGE_KEYS.WEIGHT_LOG, next);
    },
    [weightLog]
  );

  const updateProfile = useCallback(async (next: UserProfile) => {
    setProfile(next);
    await setItem(STORAGE_KEYS.PROFILE, next);
  }, []);

  // Clears in-memory weight log + profile back to defaults. Called alongside
  // useSettings().resetData() so this hook's state doesn't hold onto stale
  // data after a reset (resetAllData() clears storage, but each hook still
  // needs to reset its own in-memory state since they don't share a store).
  const resetProgress = useCallback(async () => {
    setWeightLog([]);
    setProfile(DEFAULT_PROFILE);
  }, []);

  // Last 7 entries for the chart, oldest to newest.
  const chartData = useMemo(() => weightLog.slice(-7), [weightLog]);

  const latestWeight = weightLog.length > 0 ? weightLog[weightLog.length - 1].weightKg : null;

  const goalProgressPercent = useMemo(() => {
    if (latestWeight === null) return 0;
    const totalDelta = profile.startingWeightKg - profile.targetWeightKg;
    if (totalDelta === 0) return 100;
    const currentDelta = profile.startingWeightKg - latestWeight;
    const percent = Math.round((currentDelta / totalDelta) * 100);
    return Math.max(0, Math.min(100, percent));
  }, [latestWeight, profile]);

  return {
    loading,
    weightLog,
    chartData,
    latestWeight,
    profile,
    updateProfile,
    resetProgress,
    addWeightEntry,
    goalProgressPercent,
  };
}
