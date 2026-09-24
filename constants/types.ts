// constants/types.ts
// Central place for shared TypeScript interfaces & types.
// Keeping these in one file avoids circular imports between hooks/components.

// ---------- Workout program (PPL plan) ----------

/** Monday-Friday split from the PPL plan. */
export type WorkoutDayKey = "push1" | "pull1" | "legs" | "push2" | "pull2";

/**
 * How an exercise progresses week to week:
 * - double:   dumbbell lift - climb reps to the top of the range, then add weight
 * - tempo:    dumbbell lift already at max weight - slow 3-4s lowering instead of more weight
 * - amrap:    bodyweight, as many reps as possible - beat last session's reps
 * - beatReps: bodyweight with a rep range - beat last session's reps
 * - timed:    holds - add seconds every week
 */
export type ProgressionType = "double" | "tempo" | "amrap" | "beatReps" | "timed";

export type ExerciseTarget =
  | { kind: "reps"; min: number; max: number }
  | { kind: "amrap"; baseline?: number }
  | { kind: "seconds"; start: number; weeklyIncrease: number };

export interface ExerciseDef {
  id: string;
  name: string;
  /** [min, max] sets, e.g. [3, 4] for "3-4 sets". */
  sets: [number, number];
  target: ExerciseTarget;
  progression: ProgressionType;
  /** Starting dumbbell weight in lb. Omitted for bodyweight moves. */
  weightLb?: number;
  /** Display text when the plan gives a weight range, e.g. "15-20lb". */
  weightNote?: string;
  perSide?: boolean;
  restSeconds: number;
  /** Short coaching cue shown under the exercise. */
  tip?: string;
}

/** A spot in a workout day. Holds the planned exercise plus swap-in alternatives. */
export interface ExerciseSlot {
  id: string;
  main: ExerciseDef;
  alternatives: ExerciseDef[];
}

export interface WorkoutDay {
  key: WorkoutDayKey;
  /** 1 = Monday ... 5 = Friday */
  weekday: number;
  shortLabel: string;
  label: string;
  focus: string;
  emoji: string;
  slots: ExerciseSlot[];
}

export interface SetLog {
  reps?: number;
  seconds?: number;
  weightLb?: number;
  done: boolean;
}

export interface ExerciseLog {
  slotId: string;
  exerciseId: string;
  /** True when the sets were done with the slow 3-4s lowering tempo. */
  tempo?: boolean;
  sets: SetLog[];
}

export interface WorkoutSession {
  id: string;
  date: string; // local yyyy-mm-dd
  dayKey: WorkoutDayKey;
  week: number;
  exercises: ExerciseLog[];
  completionPercent: number;
}

/** In-progress (not yet logged) inputs for one workout day. */
export interface WorkoutDraft {
  date: string;
  dayKey: WorkoutDayKey;
  exercises: Record<string, ExerciseLog>; // keyed by slotId
}

export interface ProgramState {
  /** Local yyyy-mm-dd of the Monday of week 1. */
  startDate: string;
}

// ---------- Walk / run tracking ----------

export type ActivityType = "walk" | "run";

/** [latitude, longitude] */
export type LatLng = [number, number];

export interface Activity {
  id: string;
  type: ActivityType;
  startedAt: string; // ISO timestamp
  endedAt: string; // ISO timestamp
  movingSeconds: number;
  distanceM: number;
  calories: number;
  /** One array per stretch of movement - a pause starts a new segment. */
  segments: LatLng[][];
  /** Moving seconds taken for each full kilometre. */
  splits: number[];
}

export interface WorkoutLogEntry {
  date: string; // ISO date (yyyy-mm-dd)
  dayKey: WorkoutDayKey;
  completionPercent: number;
}

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fats: number; // grams
  loggedAt: string; // ISO timestamp
}

export interface NutritionGoals {
  calorieGoal: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
}

export interface WeightEntry {
  date: string; // ISO date
  weightKg: number;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export type FitnessGoal = "loseFat" | "buildMuscle" | "maintain";
export type Gender = "male" | "female";

export interface UserProfile {
  name: string;
  gender: Gender;
  age: number;
  goals: FitnessGoal[];
  heightCm: number;
  startingWeightKg: number;
  targetWeightKg: number;
  /** How many days per week the person plans to train - drives the activity multiplier used in calorie/macro calculations. */
  workoutsPerWeek: number;
}

/** A pre-built meal suggestion, tagged by which fitness goal(s) it best suits. */
export interface SuggestedMeal {
  id: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  goals: FitnessGoal[];
}

export interface AppSettings {
  darkMode: boolean;
  notificationsEnabled: boolean;
  /** False until the person finishes the onboarding questionnaire (gender, height, weight, goal, etc). */
  onboardingComplete: boolean;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null; // ISO date
}
