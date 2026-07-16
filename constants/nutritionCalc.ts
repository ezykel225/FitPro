// constants/nutritionCalc.ts
// Turns onboarding answers (gender, age, height, weight, training frequency,
// goal) into a personalized daily calorie + macro target.
//
// Uses the Mifflin-St Jeor equation for BMR - the same standard formula
// used by most mainstream fitness apps. This is a well-established estimate,
// not a medical prescription: goals stay fully editable afterward in
// Settings, and anyone with specific medical/dietary needs should check
// with a doctor or registered dietitian rather than relying solely on this.

import { FitnessGoal, Gender, NutritionGoals } from "./types";

export interface CalorieCalcInput {
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  workoutsPerWeek: number; // 0-7
  goals: FitnessGoal[];
}

/** Standard activity-multiplier bands, mapped from planned workouts/week. */
function activityMultiplier(workoutsPerWeek: number): number {
  if (workoutsPerWeek <= 1) return 1.2; // sedentary / little exercise
  if (workoutsPerWeek <= 3) return 1.375; // light exercise 2-3x/week
  if (workoutsPerWeek <= 5) return 1.55; // moderate exercise 4-5x/week
  return 1.725; // very active 6-7x/week
}

export function calculateNutritionGoals(input: CalorieCalcInput): NutritionGoals {
  const { gender, age, heightCm, weightKg, workoutsPerWeek, goals } = input;

  const bmr =
    gender === "male"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const tdee = bmr * activityMultiplier(workoutsPerWeek);

  // Recomposition = Lose Fat + Build Muscle picked together. Neither a full
  // deficit nor a full surplus fits, so we split the difference: a mild
  // deficit that still supports muscle growth when paired with enough protein.
  const isRecomp = goals.includes("loseFat") && goals.includes("buildMuscle");

  let calorieGoal = tdee;
  if (isRecomp) calorieGoal = tdee - 150; // mild deficit, favors recomposition
  else if (goals.includes("loseFat")) calorieGoal = tdee - 500; // ~1lb/week deficit
  else if (goals.includes("buildMuscle")) calorieGoal = tdee + 300; // lean surplus

  // Safety floor so a small/older/less-active profile never gets an
  // unreasonably low target.
  calorieGoal = Math.max(calorieGoal, gender === "male" ? 1500 : 1200);
  calorieGoal = Math.round(calorieGoal / 10) * 10;

  // Protein: grams per kg bodyweight, highest when cutting/recomping to
  // preserve or build muscle while calories are limited.
  const proteinPerKg = isRecomp
    ? 2.2
    : goals.includes("loseFat")
    ? 2.2
    : goals.includes("buildMuscle")
    ? 2.0
    : 1.8;
  const proteinGoal = Math.round(proteinPerKg * weightKg);

  // Fat: ~25% of total calories.
  const fatGoal = Math.round((calorieGoal * 0.25) / 9);

  // Carbs: whatever calories remain.
  const proteinCals = proteinGoal * 4;
  const fatCals = fatGoal * 9;
  const carbGoal = Math.max(0, Math.round((calorieGoal - proteinCals - fatCals) / 4));

  return { calorieGoal, proteinGoal, carbGoal, fatGoal };
}
