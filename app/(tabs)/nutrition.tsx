// app/(tabs)/nutrition.tsx
// NUTRITION SCREEN
// Daily targets from the PPL nutrition plan, the 12pm-8pm eating window,
// one-tap Meal 1 / Meal 2 options, what to eat vs. cut back on, custom meal
// logging, and today's logged meals.

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { showAlert } from "../../services/alert";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Header from "../../components/Header";
import Card from "../../components/Card";
import ProgressBar from "../../components/ProgressBar";
import { useAppTheme } from "../../context/ThemeContext";
import { useNutrition } from "../../hooks/useNutrition";
import { useAchievements } from "../../hooks/useAchievements";
import { useWorkout } from "../../hooks/useWorkout";
import {
  EATING_WINDOW,
  FOODS_TO_EAT,
  FOODS_TO_LIMIT,
  NUTRITION_TIPS,
  PLAN_MEALS,
  PlanMeal,
  FoodGroup,
} from "../../constants/mealPlan";
import { spacing, radius } from "../../constants/theme";

function formatHour(h: number): string {
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 === 0 ? 12 : h % 12}:00 ${suffix}`;
}

function formatGap(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** Where we are relative to the 12pm-8pm eating window right now. */
function eatingWindowStatus(now = new Date()) {
  const minutes = now.getHours() * 60 + now.getMinutes();
  const start = EATING_WINDOW.startHour * 60;
  const end = EATING_WINDOW.endHour * 60;
  if (minutes < start) return { open: false, text: `Opens in ${formatGap(start - minutes)}`, suggestedSlot: 1 as const };
  if (minutes < end) {
    return {
      open: true,
      text: `Open · closes in ${formatGap(end - minutes)}`,
      suggestedSlot: (now.getHours() >= 17 ? 2 : 1) as 1 | 2,
    };
  }
  return { open: false, text: "Closed for today. Opens at 12:00 PM", suggestedSlot: 1 as const };
}

export default function NutritionScreen() {
  const { theme } = useAppTheme();
  const { loading, todaysMeals, todaysTotals, goals, addMeal, deleteMeal } = useNutrition();
  const { checkAndUnlock } = useAchievements();
  const { streak, totalWorkoutsCompleted } = useWorkout();

  const eatWindow = eatingWindowStatus();
  const [mealSlot, setMealSlot] = useState<1 | 2>(eatWindow.suggestedSlot);
  const [foodTab, setFoodTab] = useState<"eat" | "limit">("eat");
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");

  const resetForm = () => {
    setName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFats("");
  };

  const afterMealLogged = async () => {
    await checkAndUnlock({
      currentStreak: streak.currentStreak,
      totalWorkoutsCompleted,
      totalMealsLogged: todaysMeals.length + 1,
    });
  };

  const handleAddMeal = async () => {
    const caloriesNum = parseInt(calories, 10);
    if (!name.trim() || Number.isNaN(caloriesNum)) {
      showAlert("Missing info", "Please enter at least a meal name and calories.");
      return;
    }
    await addMeal({
      name: name.trim(),
      calories: caloriesNum,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fats: parseFloat(fats) || 0,
    });
    await afterMealLogged();
    resetForm();
    setShowForm(false);
  };

  const handleQuickAdd = async (meal: PlanMeal) => {
    await addMeal({
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fats: meal.fats,
    });
    await afterMealLogged();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </SafeAreaView>
    );
  }

  const caloriesLeft = goals.calorieGoal - todaysTotals.calories;
  const proteinLeft = Math.max(0, goals.proteinGoal - todaysTotals.protein);
  const slotMeals = PLAN_MEALS.filter((m) => m.slot === mealSlot);
  const foodGroups: FoodGroup[] = foodTab === "eat" ? FOODS_TO_EAT : FOODS_TO_LIMIT;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Header title="Nutrition" subtitle="Fat-loss plan · 2 meals a day" />

        {/* Today vs. targets */}
        <Card>
          <View style={styles.leftRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bigNumber, { color: caloriesLeft >= 0 ? theme.text : theme.danger }]}>
                {Math.abs(caloriesLeft).toLocaleString()}
              </Text>
              <Text style={[styles.smallLabel, { color: theme.subtext }]}>
                {caloriesLeft >= 0 ? "kcal left" : "kcal over"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bigNumber, { color: theme.success }]}>{proteinLeft}g</Text>
              <Text style={[styles.smallLabel, { color: theme.subtext }]}>protein left</Text>
            </View>
          </View>
          <ProgressBar
            percent={goals.calorieGoal > 0 ? (todaysTotals.calories / goals.calorieGoal) * 100 : 0}
            label={`Calories: ${todaysTotals.calories} / ${goals.calorieGoal} kcal`}
            color={theme.warning}
          />
          <ProgressBar
            percent={goals.proteinGoal > 0 ? (todaysTotals.protein / goals.proteinGoal) * 100 : 0}
            label={`Protein: ${todaysTotals.protein}g / ${goals.proteinGoal}g`}
            color={theme.success}
          />
          <ProgressBar
            percent={goals.carbGoal > 0 ? (todaysTotals.carbs / goals.carbGoal) * 100 : 0}
            label={`Carbs: ${todaysTotals.carbs}g / ${goals.carbGoal}g`}
            color={theme.primary}
          />
          <ProgressBar
            percent={goals.fatGoal > 0 ? (todaysTotals.fats / goals.fatGoal) * 100 : 0}
            label={`Fats: ${todaysTotals.fats}g / ${goals.fatGoal}g`}
            color={theme.danger}
          />
        </Card>

        {/* Eating window */}
        <Card style={styles.windowCard}>
          <View style={[styles.windowIcon, { backgroundColor: (eatWindow.open ? theme.success : theme.subtext) + "26" }]}>
            <Feather name="clock" size={18} color={eatWindow.open ? theme.success : theme.subtext} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.windowTitle, { color: theme.text }]}>
              Eating window {formatHour(EATING_WINDOW.startHour)} – {formatHour(EATING_WINDOW.endHour)}
            </Text>
            <Text style={{ color: eatWindow.open ? theme.success : theme.subtext, fontSize: 13, fontWeight: "600" }}>
              {eatWindow.text}
            </Text>
          </View>
        </Card>

        {/* Meal options */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Your meal plan</Text>
        <View style={[styles.segment, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {([1, 2] as const).map((slot) => {
            const active = slot === mealSlot;
            return (
              <Pressable
                key={slot}
                onPress={() => setMealSlot(slot)}
                style={[styles.segmentOption, active && { backgroundColor: theme.primary }]}
              >
                <Text style={[styles.segmentText, { color: active ? "#fff" : theme.text }]}>
                  {slot === 1 ? "Meal 1 · 12 PM" : "Meal 2 · 6-7 PM"}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.hint, { color: theme.subtext }]}>
          {mealSlot === 1 ? "Lighter, carb-forward." : "Bigger, protein-forward."} Tap + to log it.
        </Text>

        {slotMeals.map((meal) => (
          <Card key={meal.id} style={styles.planMeal}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.mealName, { color: theme.text }]}>{meal.name}</Text>
              <Text style={[styles.ingredients, { color: theme.subtext }]}>{meal.ingredients}</Text>
              <Text style={[styles.macros, { color: theme.info }]}>
                {meal.calories} kcal · P{meal.protein}g · C{meal.carbs}g · F{meal.fats}g
              </Text>
            </View>
            <Pressable
              onPress={() => handleQuickAdd(meal)}
              style={[styles.plusButton, { backgroundColor: theme.primary }]}
              accessibilityLabel={`Log ${meal.name}`}
            >
              <Feather name="plus" size={20} color="#fff" />
            </Pressable>
          </Card>
        ))}
        <Text style={[styles.footnote, { color: theme.subtext }]}>
          Calories & protein from your plan; carbs & fat estimated from the ingredients.
        </Text>

        {/* What to eat / limit */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>What to eat</Text>
        <View style={[styles.segment, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {(["eat", "limit"] as const).map((tab) => {
            const active = tab === foodTab;
            const color = tab === "eat" ? theme.success : theme.danger;
            return (
              <Pressable
                key={tab}
                onPress={() => setFoodTab(tab)}
                style={[styles.segmentOption, active && { backgroundColor: color }]}
              >
                <Text style={[styles.segmentText, { color: active ? "#fff" : theme.text }]}>
                  {tab === "eat" ? "✅ Eat this" : "🚫 Cut back"}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Card>
          {foodGroups.map((group, i) => (
            <View
              key={group.title}
              style={[styles.foodRow, i < foodGroups.length - 1 && { borderBottomWidth: 1, borderColor: theme.border }]}
            >
              <Text style={styles.foodEmoji}>{group.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.foodTitle, { color: theme.text }]}>{group.title}</Text>
                <Text style={[styles.foodItems, { color: theme.subtext }]}>{group.items}</Text>
              </View>
            </View>
          ))}
        </Card>

        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Tips</Text>
          {NUTRITION_TIPS.map((tip) => (
            <View key={tip} style={styles.tipRow}>
              <Text style={{ color: theme.primary }}>•</Text>
              <Text style={[styles.tipText, { color: theme.subtext }]}>{tip}</Text>
            </View>
          ))}
        </Card>

        {/* Today's log */}
        <View style={styles.logHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Today's meals</Text>
          <Pressable onPress={() => setShowForm((s) => !s)} style={styles.customButton}>
            <Feather name={showForm ? "x" : "edit-3"} size={14} color={theme.primary} />
            <Text style={{ color: theme.primary, fontWeight: "700", fontSize: 13 }}>
              {showForm ? "Close" : "Custom meal"}
            </Text>
          </Pressable>
        </View>

        {showForm ? (
          <Card>
            <TextInput
              placeholder="Meal name (e.g. Chicken rice)"
              placeholderTextColor={theme.subtext}
              value={name}
              onChangeText={setName}
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            />
            <View style={styles.macroRow}>
              <TextInput
                placeholder="Calories"
                placeholderTextColor={theme.subtext}
                value={calories}
                onChangeText={setCalories}
                keyboardType="numeric"
                style={[styles.input, styles.macroInput, { color: theme.text, borderColor: theme.border }]}
              />
              <TextInput
                placeholder="Protein (g)"
                placeholderTextColor={theme.subtext}
                value={protein}
                onChangeText={setProtein}
                keyboardType="numeric"
                style={[styles.input, styles.macroInput, { color: theme.text, borderColor: theme.border }]}
              />
            </View>
            <View style={styles.macroRow}>
              <TextInput
                placeholder="Carbs (g)"
                placeholderTextColor={theme.subtext}
                value={carbs}
                onChangeText={setCarbs}
                keyboardType="numeric"
                style={[styles.input, styles.macroInput, { color: theme.text, borderColor: theme.border }]}
              />
              <TextInput
                placeholder="Fats (g)"
                placeholderTextColor={theme.subtext}
                value={fats}
                onChangeText={setFats}
                keyboardType="numeric"
                style={[styles.input, styles.macroInput, { color: theme.text, borderColor: theme.border }]}
              />
            </View>
            <Pressable onPress={handleAddMeal} style={[styles.addButton, { backgroundColor: theme.primary }]}>
              <Text style={styles.addButtonText}>Add Meal</Text>
            </Pressable>
          </Card>
        ) : null}

        {todaysMeals.length === 0 ? (
          <Card>
            <Text style={{ color: theme.subtext }}>No meals logged yet today.</Text>
          </Card>
        ) : (
          todaysMeals.map((meal) => (
            <Card key={meal.id}>
              <View style={styles.mealRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.mealName, { color: theme.text }]}>{meal.name}</Text>
                  <Text style={{ color: theme.subtext, fontSize: 12 }}>
                    {meal.calories} kcal · P{meal.protein}g · C{meal.carbs}g · F{meal.fats}g
                  </Text>
                </View>
                <Pressable onPress={() => deleteMeal(meal.id)}>
                  <Text style={{ color: theme.danger, fontWeight: "600" }}>Delete</Text>
                </Pressable>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: spacing.sm, marginTop: spacing.xs },
  leftRow: { flexDirection: "row", marginBottom: spacing.sm },
  bigNumber: { fontSize: 30, fontWeight: "900" },
  smallLabel: { fontSize: 12, fontWeight: "600" },
  windowCard: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  windowIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  windowTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  segment: { flexDirection: "row", borderWidth: 1, borderRadius: radius.pill, padding: 4, marginBottom: spacing.sm },
  segmentOption: { flex: 1, paddingVertical: 9, borderRadius: radius.pill, alignItems: "center" },
  segmentText: { fontSize: 13, fontWeight: "700" },
  hint: { fontSize: 12, marginBottom: spacing.sm },
  planMeal: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  ingredients: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  macros: { fontSize: 12, fontWeight: "700", marginTop: 6 },
  plusButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  footnote: { fontSize: 11, marginBottom: spacing.md },
  foodRow: { flexDirection: "row", gap: spacing.sm, paddingVertical: 10 },
  foodEmoji: { fontSize: 20 },
  foodTitle: { fontSize: 14, fontWeight: "700" },
  foodItems: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  tipRow: { flexDirection: "row", gap: 8, marginBottom: 6 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 18 },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  customButton: { flexDirection: "row", alignItems: "center", gap: 4, padding: 6 },
  input: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    marginBottom: spacing.sm,
    fontSize: 16,
  },
  macroRow: { flexDirection: "row", gap: spacing.sm },
  macroInput: { flex: 1 },
  addButton: { borderRadius: radius.md, paddingVertical: spacing.sm + 2, alignItems: "center" },
  addButtonText: { color: "#fff", fontWeight: "700" },
  mealRow: { flexDirection: "row", alignItems: "center" },
  mealName: { fontSize: 15, fontWeight: "700" },
});
