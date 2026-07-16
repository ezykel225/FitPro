// constants/types.ts
// Central place for shared TypeScript interfaces & types.
// Keeping these in one file avoids circular imports between hooks/components.

export type WorkoutDayKey =
  | "push"
  | "pull"
  | "legs"
  | "upper"
  | "fullBody";

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string; // e.g. "10-12" or "AMRAP"
  restSeconds: number;
  completed: boolean;
}

export interface WorkoutDay {
  key: WorkoutDayKey;
  label: string;
  emoji: string;
  exercises: Exercise[];
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
