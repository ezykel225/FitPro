// app/(tabs)/settings.tsx
// SETTINGS SCREEN
// Edit profile (including the body stats collected during onboarding),
// change nutrition/weight goals, recalculate goals from current stats,
// reset all data, toggle dark mode, and toggle notifications.

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Switch,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Header from "../../components/Header";
import Card from "../../components/Card";
import { useAppTheme } from "../../context/ThemeContext";
import { useProgress } from "../../hooks/useProgress";
import { useNutrition } from "../../hooks/useNutrition";
import { calculateNutritionGoals } from "../../constants/nutritionCalc";
import { Gender, FitnessGoal } from "../../constants/types";
import { spacing, radius } from "../../constants/theme";

const GENDER_OPTIONS: Gender[] = ["male", "female"];
const GOAL_OPTIONS: { key: FitnessGoal; label: string }[] = [
  { key: "loseFat", label: "Lose Fat" },
  { key: "buildMuscle", label: "Build Muscle" },
  { key: "maintain", label: "Maintain" },
];

export default function SettingsScreen() {
  const { theme, isDark, toggleDarkMode, settings, toggleNotifications, resetData } = useAppTheme();
  const { profile, updateProfile, resetProgress, loading: progressLoading } = useProgress();
  const { goals, updateGoals, loading: nutritionLoading } = useNutrition();

  const [name, setName] = useState(profile.name);
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [age, setAge] = useState(String(profile.age));
  const [heightCm, setHeightCm] = useState(String(profile.heightCm));
  const [weightKg, setWeightKg] = useState(String(profile.startingWeightKg));
  const [targetWeight, setTargetWeight] = useState(String(profile.targetWeightKg));
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState(profile.workoutsPerWeek);
  const [selectedGoals, setSelectedGoals] = useState<FitnessGoal[]>(profile.goals);
  const [calorieGoal, setCalorieGoal] = useState(String(goals.calorieGoal));

  const toggleGoal = (g: FitnessGoal) => {
    if (g === "maintain") {
      setSelectedGoals(["maintain"]);
      return;
    }
    setSelectedGoals((prev) => {
      const withoutMaintain = prev.filter((p) => p !== "maintain");
      return withoutMaintain.includes(g)
        ? withoutMaintain.filter((p) => p !== g)
        : [...withoutMaintain, g];
    });
  };

  useEffect(() => setName(profile.name), [profile.name]);
  useEffect(() => setGender(profile.gender), [profile.gender]);
  useEffect(() => setAge(String(profile.age)), [profile.age]);
  useEffect(() => setHeightCm(String(profile.heightCm)), [profile.heightCm]);
  useEffect(() => setWeightKg(String(profile.startingWeightKg)), [profile.startingWeightKg]);
  useEffect(() => setTargetWeight(String(profile.targetWeightKg)), [profile.targetWeightKg]);
  useEffect(() => setWorkoutsPerWeek(profile.workoutsPerWeek), [profile.workoutsPerWeek]);
  useEffect(() => setSelectedGoals(profile.goals), [profile.goals]);
  useEffect(() => setCalorieGoal(String(goals.calorieGoal)), [goals.calorieGoal]);

  const loading = progressLoading || nutritionLoading;

  const handleSaveProfile = async () => {
    const target = parseFloat(targetWeight);
    const heightNum = parseFloat(heightCm);
    const weightNum = parseFloat(weightKg);
    const ageNum = parseInt(age, 10);
    await updateProfile({
      ...profile,
      name: name.trim() || profile.name,
      gender,
      age: Number.isNaN(ageNum) ? profile.age : ageNum,
      goals: selectedGoals,
      heightCm: Number.isNaN(heightNum) ? profile.heightCm : heightNum,
      startingWeightKg: Number.isNaN(weightNum) ? profile.startingWeightKg : weightNum,
      targetWeightKg: Number.isNaN(target) ? profile.targetWeightKg : target,
      workoutsPerWeek,
    });
    Alert.alert("Saved", "Your profile has been updated.");
  };

  const handleRecalculateGoals = async () => {
    const heightNum = parseFloat(heightCm) || profile.heightCm;
    const weightNum = parseFloat(weightKg) || profile.startingWeightKg;
    const ageNum = parseInt(age, 10) || profile.age;
    const next = calculateNutritionGoals({
      gender,
      age: ageNum,
      heightCm: heightNum,
      weightKg: weightNum,
      workoutsPerWeek,
      goals: selectedGoals,
    });
    await updateGoals(next);
    Alert.alert(
      "Goals recalculated",
      `Calories: ${next.calorieGoal} kcal · Protein: ${next.proteinGoal}g · Carbs: ${next.carbGoal}g · Fats: ${next.fatGoal}g`
    );
  };

  const handleSaveGoals = async () => {
    const calGoal = parseInt(calorieGoal, 10);
    await updateGoals({
      ...goals,
      calorieGoal: Number.isNaN(calGoal) ? goals.calorieGoal : calGoal,
    });
    Alert.alert("Saved", "Your nutrition goal has been updated.");
  };

  const handleResetData = () => {
    Alert.alert(
      "Reset all data?",
      "This will permanently erase workouts, meals, weight logs, and badges, and send you back through setup. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await resetData();
            await resetProgress();
            router.replace("/onboarding");
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header title="Settings" subtitle="Tweak things, then get back to it." />

        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Profile</Text>
          <TextInput
            placeholder="Name"
            placeholderTextColor={theme.subtext}
            value={name}
            onChangeText={setName}
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          />

          <Text style={[styles.fieldLabel, { color: theme.subtext }]}>Gender</Text>
          <View style={styles.pillRow}>
            {GENDER_OPTIONS.map((g) => (
              <Pressable
                key={g}
                onPress={() => setGender(g)}
                style={[
                  styles.pill,
                  {
                    backgroundColor: gender === g ? theme.primary : theme.background,
                    borderColor: gender === g ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text style={{ color: gender === g ? "#fff" : theme.text, fontWeight: "600", fontSize: 13 }}>
                  {g === "male" ? "Male" : "Female"}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.macroRow}>
            <View style={styles.macroInput}>
              <Text style={[styles.fieldLabel, { color: theme.subtext }]}>Age</Text>
              <TextInput
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              />
            </View>
            <View style={styles.macroInput}>
              <Text style={[styles.fieldLabel, { color: theme.subtext }]}>Height (cm)</Text>
              <TextInput
                value={heightCm}
                onChangeText={setHeightCm}
                keyboardType="numeric"
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              />
            </View>
          </View>

          <View style={styles.macroRow}>
            <View style={styles.macroInput}>
              <Text style={[styles.fieldLabel, { color: theme.subtext }]}>Current weight (kg)</Text>
              <TextInput
                value={weightKg}
                onChangeText={setWeightKg}
                keyboardType="numeric"
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              />
            </View>
            <View style={styles.macroInput}>
              <Text style={[styles.fieldLabel, { color: theme.subtext }]}>Target weight (kg)</Text>
              <TextInput
                value={targetWeight}
                onChangeText={setTargetWeight}
                keyboardType="numeric"
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              />
            </View>
          </View>

          <Text style={[styles.fieldLabel, { color: theme.subtext }]}>Workouts per week</Text>
          <View style={styles.stepperRow}>
            <Pressable
              onPress={() => setWorkoutsPerWeek((n) => Math.max(0, n - 1))}
              style={[styles.stepperButton, { borderColor: theme.border }]}
            >
              <Feather name="minus" size={16} color={theme.text} />
            </Pressable>
            <Text style={[styles.stepperValue, { color: theme.text }]}>{workoutsPerWeek}</Text>
            <Pressable
              onPress={() => setWorkoutsPerWeek((n) => Math.min(7, n + 1))}
              style={[styles.stepperButton, { borderColor: theme.border }]}
            >
              <Feather name="plus" size={16} color={theme.text} />
            </Pressable>
          </View>

          <Text style={[styles.fieldLabel, { color: theme.subtext, marginTop: spacing.sm }]}>Goal</Text>
          <View style={styles.pillRow}>
            {GOAL_OPTIONS.map((g) => {
              const selected = selectedGoals.includes(g.key);
              return (
                <Pressable
                  key={g.key}
                  onPress={() => toggleGoal(g.key)}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: selected ? theme.primary : theme.background,
                      borderColor: selected ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text style={{ color: selected ? "#fff" : theme.text, fontWeight: "600", fontSize: 13 }}>
                    {g.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {selectedGoals.includes("loseFat") && selectedGoals.includes("buildMuscle") && (
            <Text style={[styles.goalsSummary, { color: theme.primary }]}>
              Body recomposition mode: mild deficit + high protein.
            </Text>
          )}

          <Pressable onPress={handleSaveProfile} style={[styles.saveButton, { backgroundColor: theme.primary, marginTop: spacing.md }]}>
            <Text style={styles.saveButtonText}>Save Profile</Text>
          </Pressable>
          <Pressable
            onPress={handleRecalculateGoals}
            style={[styles.recalcButton, { borderColor: theme.info }]}
          >
            <Feather name="refresh-cw" size={14} color={theme.info} />
            <Text style={{ color: theme.info, fontWeight: "700", marginLeft: 6 }}>
              Recalculate Goals From These Stats
            </Text>
          </Pressable>
        </Card>

        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Goals</Text>
          <Text style={[styles.goalsSummary, { color: theme.subtext }]}>
            Protein {goals.proteinGoal}g · Carbs {goals.carbGoal}g · Fats {goals.fatGoal}g
          </Text>
          <TextInput
            placeholder="Daily calorie goal"
            placeholderTextColor={theme.subtext}
            value={calorieGoal}
            onChangeText={setCalorieGoal}
            keyboardType="numeric"
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          />
          <Pressable onPress={handleSaveGoals} style={[styles.saveButton, { backgroundColor: theme.primary }]}>
            <Text style={styles.saveButtonText}>Save Goals</Text>
          </Pressable>
        </Card>

        <Card>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: theme.text }]}>Dark Mode</Text>
            <Switch value={isDark} onValueChange={toggleDarkMode} />
          </View>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: theme.text }]}>Notifications</Text>
            <Switch value={settings.notificationsEnabled} onValueChange={toggleNotifications} />
          </View>
        </Card>

        <Pressable onPress={handleResetData} style={[styles.resetButton, { borderColor: theme.danger }]}>
          <Text style={{ color: theme.danger, fontWeight: "700" }}>Reset All Data</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: spacing.sm },
  fieldLabel: { fontSize: 12, fontWeight: "600", marginBottom: 4, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    marginBottom: spacing.sm,
  },
  macroRow: { flexDirection: "row", gap: spacing.sm },
  macroInput: { flex: 1 },
  pillRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  pill: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingVertical: 8,
    alignItems: "center",
  },
  stepperRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.sm },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: { fontSize: 20, fontWeight: "800", minWidth: 24, textAlign: "center" },
  saveButton: { borderRadius: radius.sm, paddingVertical: spacing.sm, alignItems: "center" },
  saveButtonText: { color: "#fff", fontWeight: "700" },
  recalcButton: {
    flexDirection: "row",
    borderWidth: 1.5,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  goalsSummary: { fontSize: 12, marginBottom: spacing.sm, fontWeight: "600" },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  switchLabel: { fontSize: 15, fontWeight: "600" },
  resetButton: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
});
