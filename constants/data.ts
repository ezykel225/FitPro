// constants/data.ts
// Static seed data: motivational quotes and default workout templates.
// Kept separate from logic so it's easy to edit/extend without touching hooks.

import { WorkoutDay, Badge, NutritionGoals, SuggestedMeal, FitnessGoal } from "./types";

export const MOTIVATIONAL_QUOTES: string[] = [
  "You don't have to be great to start, but you have to start to be great.",
  "Lazy is fine. Consistent is better. Do the 5-minute version today.",
  "Small effort, done daily, beats a huge effort done never.",
  "Your future self is watching you decide right now.",
  "The couch will still be there after your workout. Go.",
  "Discipline is choosing between what you want now and what you want most.",
  "One more rep than yesterday is still progress.",
  "You didn't come this far to only come this far.",
];

export function getQuoteForToday(): string {
  const dayIndex = new Date().getDate() % MOTIVATIONAL_QUOTES.length;
  return MOTIVATIONAL_QUOTES[dayIndex];
}

export const DEFAULT_WORKOUTS: WorkoutDay[] = [
  {
    key: "push",
    label: "Push Day",
    emoji: "💪",
    exercises: [
      { id: "push-1", name: "Push-Ups", sets: 3, reps: "10-15", restSeconds: 60, completed: false },
      { id: "push-2", name: "Shoulder Press (dumbbell)", sets: 3, reps: "10-12", restSeconds: 60, completed: false },
      { id: "push-3", name: "Tricep Dips", sets: 3, reps: "8-12", restSeconds: 45, completed: false },
      { id: "push-4", name: "Incline Dumbbell Press", sets: 3, reps: "10-12", restSeconds: 60, completed: false },
    ],
  },
  {
    key: "pull",
    label: "Pull Day",
    emoji: "🏋️",
    exercises: [
      { id: "pull-1", name: "Bent-Over Rows (dumbbell)", sets: 3, reps: "10-12", restSeconds: 60, completed: false },
      { id: "pull-2", name: "Bicep Curls", sets: 3, reps: "10-12", restSeconds: 45, completed: false },
      { id: "pull-3", name: "Superman Holds", sets: 3, reps: "20-30s", restSeconds: 45, completed: false },
      { id: "pull-4", name: "Face Pulls (band)", sets: 3, reps: "12-15", restSeconds: 45, completed: false },
    ],
  },
  {
    key: "legs",
    label: "Leg Day",
    emoji: "🦵",
    exercises: [
      { id: "legs-1", name: "Bodyweight Squats", sets: 4, reps: "12-15", restSeconds: 60, completed: false },
      { id: "legs-2", name: "Lunges", sets: 3, reps: "10 each leg", restSeconds: 60, completed: false },
      { id: "legs-3", name: "Glute Bridges", sets: 3, reps: "12-15", restSeconds: 45, completed: false },
      { id: "legs-4", name: "Calf Raises", sets: 3, reps: "15-20", restSeconds: 30, completed: false },
    ],
  },
  {
    key: "upper",
    label: "Upper Body Day",
    emoji: "🔥",
    exercises: [
      { id: "upper-1", name: "Push-Ups", sets: 3, reps: "10-15", restSeconds: 60, completed: false },
      { id: "upper-2", name: "Dumbbell Rows", sets: 3, reps: "10-12", restSeconds: 60, completed: false },
      { id: "upper-3", name: "Lateral Raises", sets: 3, reps: "12-15", restSeconds: 45, completed: false },
      { id: "upper-4", name: "Plank", sets: 3, reps: "30-45s", restSeconds: 45, completed: false },
    ],
  },
  {
    key: "fullBody",
    label: "Full Body Day",
    emoji: "⚡",
    exercises: [
      { id: "full-1", name: "Squats", sets: 3, reps: "12-15", restSeconds: 60, completed: false },
      { id: "full-2", name: "Push-Ups", sets: 3, reps: "10-15", restSeconds: 60, completed: false },
      { id: "full-3", name: "Dumbbell Rows", sets: 3, reps: "10-12", restSeconds: 60, completed: false },
      { id: "full-4", name: "Plank", sets: 3, reps: "30-45s", restSeconds: 45, completed: false },
    ],
  },
];

export const DEFAULT_NUTRITION_GOALS: NutritionGoals = {
  calorieGoal: 2200,
  proteinGoal: 140,
  carbGoal: 220,
  fatGoal: 70,
};

export const DEFAULT_BADGES: Badge[] = [
  { id: "first-workout", title: "First Step", description: "Complete your first workout", emoji: "🥇", unlocked: false },
  { id: "streak-3", title: "Warming Up", description: "Reach a 3-day streak", emoji: "🔥", unlocked: false },
  { id: "streak-7", title: "One Week Wonder", description: "Reach a 7-day streak", emoji: "🏆", unlocked: false },
  { id: "streak-30", title: "Habit Master", description: "Reach a 30-day streak", emoji: "👑", unlocked: false },
  { id: "workouts-10", title: "Getting Serious", description: "Complete 10 total workouts", emoji: "💪", unlocked: false },
  { id: "workouts-50", title: "Iron Will", description: "Complete 50 total workouts", emoji: "🛡️", unlocked: false },
  { id: "first-meal", title: "Mindful Eater", description: "Log your first meal", emoji: "🍎", unlocked: false },
];

// A small tagged meal library. Each meal is tagged with the fitness
// goal(s) it best fits (loseFat = higher protein/lower calorie density,
// buildMuscle = higher calorie + protein, maintain = balanced), so the
// Nutrition screen can surface options that match the person's onboarding
// goal instead of a generic, one-size-fits-all list.
export const SUGGESTED_MEALS: SuggestedMeal[] = [
  {
    id: "sm-grilled-chicken-salad",
    name: "Grilled Chicken & Greens Salad",
    description: "Grilled chicken breast over greens, cherry tomatoes, cucumber, light vinaigrette.",
    calories: 380,
    protein: 42,
    carbs: 18,
    fats: 14,
    goals: ["loseFat", "maintain"],
  },
  {
    id: "sm-egg-white-oats",
    name: "Egg White Scramble & Oats",
    description: "Egg whites with spinach and mushrooms, side of plain oats with a few berries.",
    calories: 340,
    protein: 30,
    carbs: 38,
    fats: 8,
    goals: ["loseFat"],
  },
  {
    id: "sm-turkey-wrap",
    name: "Turkey & Veggie Wrap",
    description: "Sliced turkey breast, lettuce, tomato, mustard in a whole-wheat wrap.",
    calories: 360,
    protein: 32,
    carbs: 34,
    fats: 10,
    goals: ["loseFat", "maintain"],
  },
  {
    id: "sm-chicken-rice-broccoli",
    name: "Chicken, Rice & Broccoli",
    description: "The classic bulking staple: chicken breast, white rice, steamed broccoli, olive oil.",
    calories: 650,
    protein: 48,
    carbs: 70,
    fats: 16,
    goals: ["buildMuscle", "maintain"],
  },
  {
    id: "sm-beef-sweet-potato",
    name: "Beef & Sweet Potato Bowl",
    description: "Lean ground beef, roasted sweet potato, sautéed peppers and onions.",
    calories: 620,
    protein: 40,
    carbs: 55,
    fats: 22,
    goals: ["buildMuscle"],
  },
  {
    id: "sm-salmon-quinoa",
    name: "Salmon & Quinoa Bowl",
    description: "Baked salmon, quinoa, roasted asparagus - great source of protein and healthy fats.",
    calories: 560,
    protein: 38,
    carbs: 42,
    fats: 24,
    goals: ["buildMuscle", "maintain"],
  },
  {
    id: "sm-greek-yogurt-bowl",
    name: "Greek Yogurt Power Bowl",
    description: "Greek yogurt, granola, banana, honey drizzle, and peanut butter.",
    calories: 480,
    protein: 28,
    carbs: 52,
    fats: 16,
    goals: ["maintain", "buildMuscle"],
  },
  {
    id: "sm-tofu-stir-fry",
    name: "Tofu Veggie Stir Fry",
    description: "Pan-seared tofu with mixed vegetables in a light soy-ginger sauce over brown rice.",
    calories: 420,
    protein: 24,
    carbs: 48,
    fats: 12,
    goals: ["loseFat", "maintain"],
  },
  {
    id: "sm-protein-shake-pb",
    name: "Protein Shake & Peanut Butter Toast",
    description: "Whey protein shake with a slice of whole-grain toast and peanut butter - fast post-workout refuel.",
    calories: 500,
    protein: 44,
    carbs: 40,
    fats: 18,
    goals: ["buildMuscle"],
  },
];

/** Returns suggested meals matching a fitness goal, most relevant first. */
export function getSuggestedMealsForGoal(goal: FitnessGoal, limit = 4): SuggestedMeal[] {
  const matches = SUGGESTED_MEALS.filter((meal) => meal.goals.includes(goal));
  return matches.slice(0, limit);
}
