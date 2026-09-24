// hooks/useWorkout.ts
// Encapsulates all workout-related state & logic for the PPL plan:
// - which plan day is selected (defaults to today's weekday)
// - which program week we're in (drives timed-hold targets)
// - today's per-set inputs (a draft, saved as you type so nothing is lost)
// - per-exercise targets from double progression, based on the last session
// - swapping an exercise for an alternative
// - logging the session, and updating the streak when it's fully completed
//
// Screens just call the functions this hook returns - they never touch
// AsyncStorage directly.

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useFocusEffect } from "expo-router";
import { WORKOUT_PLAN, resolveExercise } from "../constants/plan";
import { planTarget, ExerciseTargetPlan, LastPerformance } from "../constants/progression";
import {
  ExerciseDef,
  ExerciseLog,
  ExerciseSlot,
  ProgramState,
  SetLog,
  StreakData,
  WorkoutDayKey,
  WorkoutDraft,
  WorkoutLogEntry,
  WorkoutSession,
} from "../constants/types";
import { getItem, setItem, STORAGE_KEYS } from "../services/storage";
import { isoWeekday, localISO, mondayOf, previousTrainingDay, programWeek } from "../services/dates";

const DEFAULT_STREAK: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
};

/** Today's plan day, or null on Saturday/Sunday. */
function todaysPlanDayKey(): WorkoutDayKey | null {
  return WORKOUT_PLAN.find((d) => d.weekday === isoWeekday())?.key ?? null;
}

export interface SlotView {
  slot: ExerciseSlot;
  exercise: ExerciseDef;
  isSwapped: boolean;
  target: ExerciseTargetPlan;
  last?: LastPerformance;
  log: ExerciseLog;
}

function buildLogFromTarget(slotId: string, exercise: ExerciseDef, target: ExerciseTargetPlan): ExerciseLog {
  return {
    slotId,
    exerciseId: exercise.id,
    tempo: target.tempo,
    sets: Array.from({ length: target.setCount }, (): SetLog => ({
      weightLb: target.weightLb,
      done: false,
    })),
  };
}

function completionOf(logs: ExerciseLog[]): number {
  const total = logs.reduce((n, l) => n + l.sets.length, 0);
  if (total === 0) return 0;
  const done = logs.reduce((n, l) => n + l.sets.filter((s) => s.done).length, 0);
  return Math.round((done / total) * 100);
}

export function useWorkout() {
  const todayKey = useMemo(todaysPlanDayKey, []);
  const [selectedDayKey, setSelectedDayKey] = useState<WorkoutDayKey>(todayKey ?? "push1");
  const [program, setProgram] = useState<ProgramState | null>(null);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [drafts, setDrafts] = useState<Partial<Record<WorkoutDayKey, WorkoutDraft>>>({});
  const [swaps, setSwaps] = useState<Record<string, string>>({});
  const [workoutLog, setWorkoutLog] = useState<WorkoutLogEntry[]>([]);
  const [streak, setStreak] = useState<StreakData>(DEFAULT_STREAK);
  const [restSecondsLeft, setRestSecondsLeft] = useState<number>(0);
  const [isResting, setIsResting] = useState(false);
  const [loading, setLoading] = useState(true);
  const restEndsAt = useRef<number>(0);

  const load = useCallback(async () => {
    const today = localISO();
    const [savedProgram, savedSessions, savedDrafts, savedSwaps, savedLog, savedStreak] = await Promise.all([
      getItem<ProgramState | null>(STORAGE_KEYS.PROGRAM, null),
      getItem<WorkoutSession[]>(STORAGE_KEYS.WORKOUT_SESSIONS, []),
      getItem<Partial<Record<WorkoutDayKey, WorkoutDraft>>>(STORAGE_KEYS.WORKOUT_DRAFTS, {}),
      getItem<Record<string, string>>(STORAGE_KEYS.EXERCISE_SWAPS, {}),
      getItem<WorkoutLogEntry[]>(STORAGE_KEYS.WORKOUT_LOG, []),
      getItem<StreakData>(STORAGE_KEYS.STREAK, DEFAULT_STREAK),
    ]);

    // First run of the PPL plan: week 1 starts this Monday.
    let nextProgram = savedProgram;
    if (!nextProgram) {
      nextProgram = { startDate: mondayOf() };
      await setItem(STORAGE_KEYS.PROGRAM, nextProgram);
    }

    // Drafts only live for the day they were started.
    const freshDrafts: Partial<Record<WorkoutDayKey, WorkoutDraft>> = {};
    for (const [key, draft] of Object.entries(savedDrafts)) {
      if (draft && draft.date === today) freshDrafts[key as WorkoutDayKey] = draft;
    }

    setProgram(nextProgram);
    setSessions(savedSessions);
    setDrafts(freshDrafts);
    setSwaps(savedSwaps);
    setWorkoutLog(savedLog);
    setStreak(savedStreak);
    setLoading(false);
  }, []);

  // Tabs stay mounted, so reload whenever a screen using this hook comes into
  // focus - otherwise Home wouldn't see a workout logged on the Workout tab.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Rest timer counts against a wall-clock end time so it stays correct even
  // if the phone locks or the browser throttles the page.
  useEffect(() => {
    if (!isResting) return;
    const interval = setInterval(() => {
      const left = Math.max(0, Math.ceil((restEndsAt.current - Date.now()) / 1000));
      setRestSecondsLeft(left);
      if (left === 0) setIsResting(false);
    }, 250);
    return () => clearInterval(interval);
  }, [isResting]);

  const week = program ? programWeek(program.startDate) : 1;
  const selectedDay = WORKOUT_PLAN.find((d) => d.key === selectedDayKey) ?? WORKOUT_PLAN[0];

  /** Most recent logged performance of an exercise, ignoring today's session for this day. */
  const lastPerformance = useCallback(
    (exerciseId: string, dayKey: WorkoutDayKey): LastPerformance | undefined => {
      const today = localISO();
      for (let i = sessions.length - 1; i >= 0; i--) {
        const s = sessions[i];
        if (s.date === today && s.dayKey === dayKey) continue;
        const log = s.exercises.find((e) => e.exerciseId === exerciseId && e.sets.some((set) => set.done));
        if (log) return { date: s.date, log };
      }
      return undefined;
    },
    [sessions]
  );

  const buildSlotViews = useCallback(
    (dayKey: WorkoutDayKey): SlotView[] => {
      const day = WORKOUT_PLAN.find((d) => d.key === dayKey);
      if (!day) return [];
      const today = localISO();
      const draft = drafts[dayKey];
      // If today's session is already logged (and not being edited), show what was logged.
      const logged = draft ? undefined : sessions.find((s) => s.date === today && s.dayKey === dayKey);
      return day.slots.map((slot) => {
        const exercise = resolveExercise(slot, swaps[slot.id]);
        const last = lastPerformance(exercise.id, dayKey);
        const target = planTarget(exercise, week, last);
        const saved = draft?.exercises[slot.id] ?? logged?.exercises.find((e) => e.slotId === slot.id);
        const log = saved && saved.exerciseId === exercise.id ? saved : buildLogFromTarget(slot.id, exercise, target);
        return { slot, exercise, isSwapped: exercise.id !== slot.main.id, target, last, log };
      });
    },
    [drafts, sessions, swaps, lastPerformance, week]
  );

  const slotViews = useMemo(() => buildSlotViews(selectedDayKey), [buildSlotViews, selectedDayKey]);

  const completionPercent = useMemo(() => completionOf(slotViews.map((v) => v.log)), [slotViews]);

  /** Completion of today's scheduled workout (for Home). 0 on rest days. */
  const todayCompletionPercent = useMemo(
    () => (todayKey ? completionOf(buildSlotViews(todayKey).map((v) => v.log)) : 0),
    [todayKey, buildSlotViews]
  );

  const loggedToday = useMemo(
    () => sessions.some((s) => s.date === localISO() && s.dayKey === selectedDayKey),
    [sessions, selectedDayKey]
  );

  // ---- Editing today's sets ----

  const writeSlotLog = useCallback(
    (slotId: string, update: (log: ExerciseLog) => ExerciseLog) => {
      const view = slotViews.find((v) => v.slot.id === slotId);
      if (!view) return;
      const draft: WorkoutDraft = drafts[selectedDayKey] ?? {
        date: localISO(),
        dayKey: selectedDayKey,
        // Editing an already-logged day starts from what was logged.
        exercises: Object.fromEntries(slotViews.map((v) => [v.slot.id, v.log])),
      };
      const nextDraft: WorkoutDraft = {
        ...draft,
        exercises: { ...draft.exercises, [slotId]: update(view.log) },
      };
      const next = { ...drafts, [selectedDayKey]: nextDraft };
      setDrafts(next);
      setItem(STORAGE_KEYS.WORKOUT_DRAFTS, next);
    },
    [slotViews, drafts, selectedDayKey]
  );

  const updateSet = useCallback(
    (slotId: string, index: number, patch: Partial<SetLog>) => {
      writeSlotLog(slotId, (log) => ({
        ...log,
        sets: log.sets.map((s, i) => (i === index ? { ...s, ...patch } : s)),
      }));
    },
    [writeSlotLog]
  );

  /** Ticks a set. Empty inputs are filled with today's target so one tap = "hit the target". */
  const toggleSetDone = useCallback(
    (slotId: string, index: number) => {
      const view = slotViews.find((v) => v.slot.id === slotId);
      if (!view) return;
      writeSlotLog(slotId, (log) => ({
        ...log,
        sets: log.sets.map((s, i) => {
          if (i !== index) return s;
          if (s.done) return { ...s, done: false };
          return {
            ...s,
            reps: s.reps ?? view.target.reps?.[i] ?? view.target.reps?.[view.target.reps.length - 1],
            seconds: s.seconds ?? view.target.seconds,
            done: true,
          };
        }),
      }));
    },
    [slotViews, writeSlotLog]
  );

  const addSet = useCallback(
    (slotId: string) => {
      writeSlotLog(slotId, (log) => {
        const lastSet = log.sets[log.sets.length - 1];
        return { ...log, sets: [...log.sets, { weightLb: lastSet?.weightLb, done: false }] };
      });
    },
    [writeSlotLog]
  );

  const removeSet = useCallback(
    (slotId: string) => {
      writeSlotLog(slotId, (log) => (log.sets.length > 1 ? { ...log, sets: log.sets.slice(0, -1) } : log));
    },
    [writeSlotLog]
  );

  const toggleTempo = useCallback(
    (slotId: string) => {
      writeSlotLog(slotId, (log) => ({ ...log, tempo: !log.tempo }));
    },
    [writeSlotLog]
  );

  /** Swap a slot to an alternative exercise (or back to the planned one with null). Sticks for future weeks. */
  const swapExercise = useCallback(
    async (slotId: string, exerciseId: string | null) => {
      const next = { ...swaps };
      if (exerciseId) next[slotId] = exerciseId;
      else delete next[slotId];
      setSwaps(next);
      await setItem(STORAGE_KEYS.EXERCISE_SWAPS, next);
    },
    [swaps]
  );

  // ---- Rest timer ----

  const startRest = useCallback((seconds: number) => {
    restEndsAt.current = Date.now() + seconds * 1000;
    setRestSecondsLeft(seconds);
    setIsResting(true);
  }, []);

  const skipRest = useCallback(() => {
    setIsResting(false);
    setRestSecondsLeft(0);
  }, []);

  // ---- Logging ----

  /** Streak counts training days (Mon-Fri), so rest weekends don't break it. */
  const updateStreak = useCallback(
    async (didCompleteToday: boolean) => {
      if (!didCompleteToday) return;
      const today = localISO();
      if (streak.lastCompletedDate === today) return; // already counted today

      const isConsecutive = streak.lastCompletedDate === previousTrainingDay(today);
      const current = isConsecutive ? streak.currentStreak + 1 : 1;
      const nextStreak: StreakData = {
        currentStreak: current,
        longestStreak: Math.max(streak.longestStreak, current),
        lastCompletedDate: today,
      };
      setStreak(nextStreak);
      await setItem(STORAGE_KEYS.STREAK, nextStreak);
    },
    [streak]
  );

  /** Saves the selected day's sets as a session (replacing one already logged today). */
  const logWorkout = useCallback(async () => {
    const today = localISO();
    const session: WorkoutSession = {
      id: `${today}-${selectedDayKey}`,
      date: today,
      dayKey: selectedDayKey,
      week,
      exercises: slotViews.map((v) => v.log),
      completionPercent,
    };
    const nextSessions = [...sessions.filter((s) => s.id !== session.id), session];
    setSessions(nextSessions);
    await setItem(STORAGE_KEYS.WORKOUT_SESSIONS, nextSessions);

    const entry: WorkoutLogEntry = { date: today, dayKey: selectedDayKey, completionPercent };
    const nextLog = [...workoutLog.filter((e) => !(e.date === today && e.dayKey === selectedDayKey)), entry];
    setWorkoutLog(nextLog);
    await setItem(STORAGE_KEYS.WORKOUT_LOG, nextLog);

    const nextDrafts = { ...drafts };
    delete nextDrafts[selectedDayKey];
    setDrafts(nextDrafts);
    await setItem(STORAGE_KEYS.WORKOUT_DRAFTS, nextDrafts);

    await updateStreak(completionPercent === 100);
  }, [selectedDayKey, week, slotViews, completionPercent, sessions, workoutLog, drafts, updateStreak]);

  const totalWorkoutsCompleted = useMemo(
    () => workoutLog.filter((e) => e.completionPercent === 100).length,
    [workoutLog]
  );

  return {
    loading,
    week,
    todayKey,
    selectedDay,
    selectedDayKey,
    setSelectedDayKey,
    slotViews,
    completionPercent,
    todayCompletionPercent,
    loggedToday,
    updateSet,
    toggleSetDone,
    addSet,
    removeSet,
    toggleTempo,
    swapExercise,
    startRest,
    skipRest,
    isResting,
    restSecondsLeft,
    logWorkout,
    sessions,
    workoutLog,
    totalWorkoutsCompleted,
    streak,
  };
}
