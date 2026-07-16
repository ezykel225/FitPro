// hooks/useWorkout.ts
// Encapsulates all workout-related state & logic:
// - which workout day is selected
// - marking exercises complete / incomplete
// - computing completion percentage
// - persisting today's workout log entry
// - updating the user's streak when a workout is fully completed
//
// Screens (app/workout.tsx, app/index.tsx) just call the functions this
// hook returns - they never touch AsyncStorage directly.

import { useState, useEffect, useCallback, useMemo } from "react";
import { DEFAULT_WORKOUTS } from "../constants/data";
import { WorkoutDay, WorkoutDayKey, WorkoutLogEntry, StreakData } from "../constants/types";
import { getItem, setItem, STORAGE_KEYS } from "../services/storage";

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

const DEFAULT_STREAK: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
};

export function useWorkout() {
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>(DEFAULT_WORKOUTS);
  const [selectedDayKey, setSelectedDayKey] = useState<WorkoutDayKey>("push");
  const [workoutLog, setWorkoutLog] = useState<WorkoutLogEntry[]>([]);
  const [streak, setStreak] = useState<StreakData>(DEFAULT_STREAK);
  const [restSecondsLeft, setRestSecondsLeft] = useState<number>(0);
  const [isResting, setIsResting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load persisted state once on mount.
  useEffect(() => {
    (async () => {
      const [savedDays, savedLog, savedStreak] = await Promise.all([
        getItem<WorkoutDay[]>(STORAGE_KEYS.WORKOUT_DAYS, DEFAULT_WORKOUTS),
        getItem<WorkoutLogEntry[]>(STORAGE_KEYS.WORKOUT_LOG, []),
        getItem<StreakData>(STORAGE_KEYS.STREAK, DEFAULT_STREAK),
      ]);
      setWorkoutDays(savedDays);
      setWorkoutLog(savedLog);
      setStreak(savedStreak);
      setLoading(false);
    })();
  }, []);

  // Simple countdown timer effect for rest periods.
  useEffect(() => {
    if (!isResting || restSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setRestSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsResting(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isResting, restSecondsLeft]);

  const selectedDay = useMemo(
    () => workoutDays.find((d) => d.key === selectedDayKey) ?? workoutDays[0],
    [workoutDays, selectedDayKey]
  );

  const completionPercent = useMemo(() => {
    if (!selectedDay || selectedDay.exercises.length === 0) return 0;
    const done = selectedDay.exercises.filter((e) => e.completed).length;
    return Math.round((done / selectedDay.exercises.length) * 100);
  }, [selectedDay]);

  const persistDays = useCallback(async (next: WorkoutDay[]) => {
    setWorkoutDays(next);
    await setItem(STORAGE_KEYS.WORKOUT_DAYS, next);
  }, []);

  const toggleExercise = useCallback(
    (exerciseId: string) => {
      const next = workoutDays.map((day) => {
        if (day.key !== selectedDayKey) return day;
        return {
          ...day,
          exercises: day.exercises.map((ex) =>
            ex.id === exerciseId ? { ...ex, completed: !ex.completed } : ex
          ),
        };
      });
      persistDays(next);
    },
    [workoutDays, selectedDayKey, persistDays]
  );

  const startRest = useCallback((seconds: number) => {
    setRestSecondsLeft(seconds);
    setIsResting(true);
  }, []);

  const skipRest = useCallback(() => {
    setIsResting(false);
    setRestSecondsLeft(0);
  }, []);

  /** Updates streak counters based on today's completion. */
  const updateStreak = useCallback(
    async (didCompleteToday: boolean) => {
      if (!didCompleteToday) return;
      const today = todayISO();
      if (streak.lastCompletedDate === today) return; // already counted today

      const isConsecutive = streak.lastCompletedDate === yesterdayISO();
      const nextStreak: StreakData = {
        currentStreak: isConsecutive ? streak.currentStreak + 1 : 1,
        longestStreak: Math.max(
          streak.longestStreak,
          isConsecutive ? streak.currentStreak + 1 : 1
        ),
        lastCompletedDate: today,
      };
      setStreak(nextStreak);
      await setItem(STORAGE_KEYS.STREAK, nextStreak);
    },
    [streak]
  );

  /** Call when the user finishes a workout session - logs it & updates streak. */
  const logTodayWorkout = useCallback(async () => {
    const today = todayISO();
    const entry: WorkoutLogEntry = {
      date: today,
      dayKey: selectedDayKey,
      completionPercent,
    };
    const nextLog = [...workoutLog.filter((e) => e.date !== today), entry];
    setWorkoutLog(nextLog);
    await setItem(STORAGE_KEYS.WORKOUT_LOG, nextLog);
    await updateStreak(completionPercent === 100);
  }, [workoutLog, selectedDayKey, completionPercent, updateStreak]);

  const totalWorkoutsCompleted = useMemo(
    () => workoutLog.filter((e) => e.completionPercent === 100).length,
    [workoutLog]
  );

  return {
    loading,
    workoutDays,
    selectedDay,
    selectedDayKey,
    setSelectedDayKey,
    completionPercent,
    toggleExercise,
    startRest,
    skipRest,
    isResting,
    restSecondsLeft,
    logTodayWorkout,
    workoutLog,
    totalWorkoutsCompleted,
    streak,
  };
}
