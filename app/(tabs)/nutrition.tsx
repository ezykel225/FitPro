// app/(tabs)/nutrition.tsx
// NUTRITION SCREEN
// Add meals with calories/protein/carbs/fats, view today's logged meals,
// and see a daily summary against configured goals.

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Header from "../../components/Header";
import Card from "../../components/Card";
import ProgressBar from "../../components/ProgressBar";
import { useAppTheme } from "../../context/ThemeContext";
import { useNutrition } from "../../hooks/useNutrition";
import { useAchievements } from "../../hooks/useAchievements";
import { useWorkout } from "../../hooks/useWorkout";
import { useProgress } from "../../hooks/useProgress";
import { getSuggestedMealsForGoal } from "../../constants/data";
import { spacing, radius } from "../../constants/theme";
import { FitnessGoal } from "../../constants/types";

const GOAL_LABELS: Record<FitnessGoal, string> = {
  loseFat: "Lose Fat",
  buildMuscle: "Build Muscle",
  maintain: "Maintain",
};

export default function NutritionScreen() {
  const { theme } = useAppTheme();
  const { loading, todaysMeals, todaysTotals, goals, addMeal, deleteMeal } = useNutrition();
  const { checkAndUnlock } = useAchievements();
  const { streak, totalWorkoutsCompleted } = useWorkout();
  const { profile, loading: profileLoading } = useProgress();

  // Profile can have multiple goals selected (e.g. Lose Fat + Build Muscle
  // for body recomposition). Pull suggested meals for each selected goal
  // and merge them, deduping by meal id in case a meal is tagged for more
  // than one goal.
  const suggestedMeals = React.useMemo(() => {
    const merged = new Map<string, ReturnType<typeof getSuggestedMealsForGoal>[number]>();
    for (const g of profile.goals) {
      for (const meal of getSuggestedMealsForGoal(g)) {
        merged.set(meal.id, meal);
      }
    }
    return Array.from(merged.values());
  }, [profile.goals]);

  const suggestedForYouLabel = profile.goals.map((g) => GOAL_LABELS[g]).join(" + ") || "Maintain";

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

  const handleAddMeal = async () => {
    const caloriesNum = parseInt(calories, 10);
    if (!name.trim() || Number.isNaN(caloriesNum)) {
      Alert.alert("Missing info", "Please enter at least a meal name and calories.");
      return;
    }
    await addMeal({
      name: name.trim(),
      calories: caloriesNum,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fats: parseFloat(fats) || 0,
    });
    await checkAndUnlock({
      currentStreak: streak.currentStreak,
      totalWorkoutsCompleted,
      totalMealsLogged: todaysMeals.length + 1,
    });
    resetForm();
  };

  const handleQuickAddSuggested = async (meal: (typeof suggestedMeals)[number]) => {
    await addMeal({
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fats: meal.fats,
    });
    await checkAndUnlock({
      currentStreak: streak.currentStreak,
      totalWorkoutsCompleted,
      totalMealsLogged: todaysMeals.length + 1,
    });
  };

  if (loading || profileLoading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header title="Nutrition" subtitle="Log it in 10 seconds, no math required." />

        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Daily Summary</Text>
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

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Suggested For You ({suggestedForYouLabel})
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestedScroll}>
          {suggestedMeals.map((meal) => (
            <View
              key={meal.id}
              style={[styles.suggestedCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <Text style={[styles.suggestedName, { color: theme.text }]} numberOfLines={2}>
                {meal.name}
              </Text>
              <Text style={[styles.suggestedDesc, { color: theme.subtext }]} numberOfLines={3}>
                {meal.description}
              </Text>
              <Text style={[styles.suggestedMacros, { color: theme.info }]}>
                {meal.calories} kcal · P{meal.protein}g · C{meal.carbs}g · F{meal.fats}g
              </Text>
              <Pressable
                onPress={() => handleQuickAddSuggested(meal)}
                style={[styles.quickAddButton, { backgroundColor: theme.primary }]}
              >
                <Feather name="plus" size={14} color="#fff" />
                <Text style={styles.quickAddText}>Quick Add</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>

        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Add a Meal</Text>
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
          <Pressable
            onPress={handleAddMeal}
            style={[styles.addButton, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.addButtonText}>Add Meal</Text>
          </Pressable>
        </Card>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Meals</Text>
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
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    marginBottom: spacing.sm,
    fontSize: 14,
  },
  macroRow: { flexDirection: "row", gap: spacing.sm },
  macroInput: { flex: 1 },
  addButton: { borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: "center" },
  addButtonText: { color: "#fff", fontWeight: "700" },
  mealRow: { flexDirection: "row", alignItems: "center" },
  mealName: { fontSize: 15, fontWeight: "600" },
  suggestedScroll: { marginBottom: spacing.md },
  suggestedCard: {
    width: 200,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  suggestedName: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  suggestedDesc: { fontSize: 11, lineHeight: 15, marginBottom: spacing.sm, minHeight: 45 },
  suggestedMacros: { fontSize: 11, fontWeight: "600", marginBottom: spacing.sm },
  quickAddButton: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    paddingVertical: 8,
  },
  quickAddText: { color: "#fff", fontWeight: "700", fontSize: 12 },
});