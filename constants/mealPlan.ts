// constants/mealPlan.ts
// Nutrition plan from the PPL program: daily targets, the 12pm-8pm eating
// window, the Meal 1 / Meal 2 rotation, and what to eat vs. cut back on.
//
// Calories and protein per meal come from the plan. The plan doesn't list
// carbs/fat per meal, so those are estimated from the listed ingredient
// weights (standard values for cooked rice, eggs, chicken breast, etc.).

import { NutritionGoals } from "./types";

/** Moderate deficit for fat loss while keeping muscle (maintenance ~2,900-3,000 kcal). */
export const PLAN_NUTRITION_GOALS: NutritionGoals = {
  calorieGoal: 2550, // plan range: 2,500-2,600
  proteinGoal: 170,
  carbGoal: 260,
  fatGoal: 90,
};

export const EATING_WINDOW = { startHour: 12, endHour: 20 };

export interface PlanMeal {
  id: string;
  slot: 1 | 2;
  name: string;
  ingredients: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export const PLAN_MEALS: PlanMeal[] = [
  // Meal 1 - 12:00 PM, lighter and carb-forward
  {
    id: "m1-eggs-oats",
    slot: 1,
    name: "Scrambled Eggs, Oats & Banana",
    ingredients: "Eggs 150g (3pcs) scrambled · rolled oats 60g (dry) · banana 100g",
    calories: 555,
    protein: 28,
    carbs: 65,
    fats: 18,
  },
  {
    id: "m1-fried-rice",
    slot: 1,
    name: "Egg Fried Rice",
    ingredients: "Eggs 100g (2pcs) · cooked rice 300g · mixed veggies 100g · oil 10g · soy sauce 10g",
    calories: 660,
    protein: 24,
    carbs: 93,
    fats: 21,
  },
  {
    id: "m1-tortang-talong",
    slot: 1,
    name: "Tortang Talong & Rice",
    ingredients: "Eggs 150g (3pcs) · eggplant 150g · cooked rice 200g · oil 10g",
    calories: 620,
    protein: 26,
    carbs: 66,
    fats: 25,
  },
  {
    id: "m1-monggo",
    slot: 1,
    name: "Ginisang Monggo, Egg & Rice",
    ingredients: "Cooked mung beans 200g · egg 50g (1pc) · cooked rice 200g · malunggay/veggies 30g",
    calories: 555,
    protein: 26,
    carbs: 97,
    fats: 6,
  },
  {
    id: "m1-tuna-rice",
    slot: 1,
    name: "Tuna Rice Bowl",
    ingredients: "Canned tuna (drained) 90g · cooked rice 250g · boiled egg 50g (1pc) · veggies 100g",
    calories: 525,
    protein: 39,
    carbs: 77,
    fats: 7,
  },
  // Meal 2 - 6-7 PM, bigger and protein-forward
  {
    id: "m2-chicken-rice",
    slot: 2,
    name: "Chicken Breast, Rice & Veggies",
    ingredients: "Chicken breast (cooked) 280g · cooked rice 300g · veggies 150g",
    calories: 880,
    protein: 98,
    carbs: 94,
    fats: 11,
  },
  {
    id: "m2-chicken-adobo",
    slot: 2,
    name: "Chicken Adobo & Rice",
    ingredients: "Chicken breast (cooked) 280g, adobo-style · cooked rice 300g · oil 10g",
    calories: 940,
    protein: 95,
    carbs: 96,
    fats: 21,
  },
  {
    id: "m2-tinola",
    slot: 2,
    name: "Chicken Tinola & Rice",
    ingredients: "Chicken breast (cooked) 280g, tinola-style · cooked rice 250g · veggies 150g",
    calories: 820,
    protein: 97,
    carbs: 82,
    fats: 12,
  },
  {
    id: "m2-grilled-fish",
    slot: 2,
    name: "Grilled Bangus or Galunggong",
    ingredients: "Grilled fish (cooked) 230g · cooked rice 250g · veggies 100g",
    calories: 780,
    protein: 55,
    carbs: 77,
    fats: 27,
  },
  {
    id: "m2-stir-fry",
    slot: 2,
    name: "Chicken Veggie Stir-Fry & Rice",
    ingredients: "Chicken breast (cooked) 280g · mixed veggies 200g · cooked rice 250g · oil 10g",
    calories: 915,
    protein: 98,
    carbs: 86,
    fats: 21,
  },
];

export interface FoodGroup {
  emoji: string;
  title: string;
  items: string;
}

export const FOODS_TO_EAT: FoodGroup[] = [
  {
    emoji: "🍗",
    title: "Protein (every meal)",
    items: "Chicken breast, eggs, canned tuna (drained), bangus, galunggong, mung beans (monggo)",
  },
  {
    emoji: "🍚",
    title: "Carbs (weighed)",
    items: "Cooked rice by the gram, rolled oats, banana",
  },
  {
    emoji: "🥬",
    title: "Veggies (swap freely, ~20-35 kcal/100g)",
    items: "Kangkong, sitaw, malunggay, sayote, repolyo, pechay, carrots, frozen mixed veggies",
  },
  {
    emoji: "🔥",
    title: "Cooking",
    items: "Grill, boil or steam instead of pan-frying. Measure oil (10g).",
  },
];

export const FOODS_TO_LIMIT: FoodGroup[] = [
  { emoji: "🍳", title: "Fried & oily food", items: "Lechon kawali, crispy pata, chicharon, anything deep-fried" },
  { emoji: "🌭", title: "Processed meats", items: "Hotdogs, Spam, canned corned beef, tocino (high sodium and fat)" },
  { emoji: "🍜", title: "Instant noodles", items: "Lucky Me etc. (high sodium, barely any protein)" },
  {
    emoji: "🥤",
    title: "Liquid calories",
    items: "Softdrinks, sweet iced tea, 3-in-1 coffee, condensed milk, juice from concentrate, energy drinks",
  },
  { emoji: "🍺", title: "Alcohol", items: "Stalls fat loss fast" },
  {
    emoji: "🍩",
    title: "Refined carbs & sugar",
    items: "Lots of white bread/pandesal, pastries, donuts, ice cream, cake, candy. Fine sometimes, not daily.",
  },
  { emoji: "🫗", title: "Extra cooking oil", items: "Measure it. Grill, boil or steam when you can." },
];

export const NUTRITION_TIPS: string[] = [
  "Pick one Meal 1 and one Meal 2 each day, and rotate so it doesn't get boring.",
  "Meat and fish weights are cooked weight. Weigh after grilling or boiling.",
  "Cook a big batch of chicken on a day off, then Meal 2 is just reheat and eat.",
  "Weigh yourself weekly. If you're not losing 0.3-0.5 kg/week after 2-3 weeks, cut calories a little.",
];
