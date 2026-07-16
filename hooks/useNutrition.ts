// hooks/useNutrition.ts
// Manages meal logging and daily macro/calorie totals.

import { useState, useEffect, useCallback, useMemo } from "react";
import { Meal, NutritionGoals } from "../constants/types";
import { DEFAULT_NUTRITION_GOALS } from "../constants/data";
import { getItem, setItem, STORAGE_KEYS } from "../services/storage";

function isToday(isoTimestamp: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return isoTimestamp.startsWith(today);
}

export interface NewMealInput {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export function useNutrition() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [goals, setGoals] = useState<NutritionGoals>(DEFAULT_NUTRITION_GOALS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [savedMeals, savedGoals] = await Promise.all([
        getItem<Meal[]>(STORAGE_KEYS.MEALS, []),
        getItem<NutritionGoals>(STORAGE_KEYS.NUTRITION_GOALS, DEFAULT_NUTRITION_GOALS),
      ]);
      setMeals(savedMeals);
      setGoals(savedGoals);
      setLoading(false);
    })();
  }, []);

  const todaysMeals = useMemo(
    () => meals.filter((m) => isToday(m.loggedAt)),
    [meals]
  );

  const todaysTotals = useMemo(() => {
    return todaysMeals.reduce(
      (acc, m) => ({
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fats: acc.fats + m.fats,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  }, [todaysMeals]);

  const addMeal = useCallback(
    async (input: NewMealInput) => {
      const newMeal: Meal = {
        id: `meal-${Date.now()}`,
        loggedAt: new Date().toISOString(),
        ...input,
      };
      const next = [...meals, newMeal];
      setMeals(next);
      await setItem(STORAGE_KEYS.MEALS, next);
      return newMeal;
    },
    [meals]
  );

  const deleteMeal = useCallback(
    async (mealId: string) => {
      const next = meals.filter((m) => m.id !== mealId);
      setMeals(next);
      await setItem(STORAGE_KEYS.MEALS, next);
    },
    [meals]
  );

  const updateGoals = useCallback(async (nextGoals: NutritionGoals) => {
    setGoals(nextGoals);
    await setItem(STORAGE_KEYS.NUTRITION_GOALS, nextGoals);
  }, []);

  return {
    loading,
    meals,
    todaysMeals,
    todaysTotals,
    goals,
    addMeal,
    deleteMeal,
    updateGoals,
  };
}
