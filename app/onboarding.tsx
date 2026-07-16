// app/onboarding.tsx
// First-run questionnaire. Collects the inputs needed to personalize the
// app (gender, age, height, weight, target weight, training frequency,
// fitness goal), then calculates a calorie + macro target using the
// Mifflin-St Jeor formula and saves everything before dropping the person
// into the main app. Runs once - gated by settings.onboardingComplete in
// the root layout.

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAppTheme } from "../context/ThemeContext";
import { useProgress } from "../hooks/useProgress";
import { useNutrition } from "../hooks/useNutrition";
import { calculateNutritionGoals } from "../constants/nutritionCalc";
import { Gender, FitnessGoal } from "../constants/types";
import { spacing, radius } from "../constants/theme";

const STEPS = ["name", "gender", "body", "activity", "goal", "summary"] as const;
type Step = (typeof STEPS)[number];

const GOAL_LABELS: Record<FitnessGoal, { title: string; blurb: string; icon: React.ComponentProps<typeof Feather>["name"] }> = {
  loseFat: { title: "Lose Fat", blurb: "Calorie deficit, higher protein to keep your muscle.", icon: "trending-down" },
  buildMuscle: { title: "Build Muscle", blurb: "Calorie surplus with plenty of protein to grow.", icon: "trending-up" },
  maintain: { title: "Maintain", blurb: "Stay right around your current weight.", icon: "minus" },
};

export default function OnboardingScreen() {
  const { theme, completeOnboarding } = useAppTheme();
  const { updateProfile } = useProgress();
  const { updateGoals } = useNutrition();

  const [stepIndex, setStepIndex] = useState(0);
  const step: Step = STEPS[stepIndex];

  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [age, setAge] = useState("25");
  const [heightCm, setHeightCm] = useState("170");
  const [weightKg, setWeightKg] = useState("70");
  const [targetWeightKg, setTargetWeightKg] = useState("65");
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState(3);
  const [goals, setGoals] = useState<FitnessGoal[]>(["buildMuscle"]);
  const [saving, setSaving] = useState(false);

  const toggleGoal = (g: FitnessGoal) => {
    if (g === "maintain") {
      // Maintain doesn't combine with a deficit/surplus goal - picking it clears the rest.
      setGoals(["maintain"]);
      return;
    }
    setGoals((prev) => {
      const withoutMaintain = prev.filter((p) => p !== "maintain");
      return withoutMaintain.includes(g)
        ? withoutMaintain.filter((p) => p !== g)
        : [...withoutMaintain, g];
    });
  };

  const goNext = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  const ageNum = parseInt(age, 10) || 25;
  const heightNum = parseFloat(heightCm) || 170;
  const weightNum = parseFloat(weightKg) || 70;
  const targetWeightNum = parseFloat(targetWeightKg) || weightNum;

  const projectedGoals = calculateNutritionGoals({
    gender,
    age: ageNum,
    heightCm: heightNum,
    weightKg: weightNum,
    workoutsPerWeek,
    goals,
  });

  const handleFinish = async () => {
    if (goals.length === 0) return; // shouldn't happen - Continue is disabled, but guard anyway
    setSaving(true);
    await updateProfile({
      name: name.trim() || "Athlete",
      gender,
      age: ageNum,
      goals,
      heightCm: heightNum,
      startingWeightKg: weightNum,
      targetWeightKg: targetWeightNum,
      workoutsPerWeek,
    });
    await updateGoals(projectedGoals);
    await completeOnboarding();
    setSaving(false);
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.progressRow}>
            {STEPS.map((s, i) => (
              <View
                key={s}
                style={[
                  styles.progressDot,
                  { backgroundColor: i <= stepIndex ? theme.primary : theme.border },
                ]}
              />
            ))}
          </View>

          {step === "name" && (
            <View>
              <Text style={[styles.title, { color: theme.text }]}>Welcome to FitPro 👋</Text>
              <Text style={[styles.subtitle, { color: theme.subtext }]}>
                Let's set up your plan. A few quick questions first.
              </Text>
              <Text style={[styles.label, { color: theme.subtext }]}>What should we call you?</Text>
              <TextInput
                placeholder="Your name"
                placeholderTextColor={theme.subtext}
                value={name}
                onChangeText={setName}
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
              />
            </View>
          )}

          {step === "gender" && (
            <View>
              <Text style={[styles.title, { color: theme.text }]}>What's your gender?</Text>
              <Text style={[styles.subtitle, { color: theme.subtext }]}>
                This helps us calculate your calorie needs accurately.
              </Text>
              <View style={styles.optionRow}>
                {(["male", "female"] as Gender[]).map((g) => (
                  <Pressable
                    key={g}
                    onPress={() => setGender(g)}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: gender === g ? `${theme.primary}22` : theme.surface,
                        borderColor: gender === g ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Feather name={g === "male" ? "user" : "user"} size={24} color={gender === g ? theme.primary : theme.subtext} />
                    <Text style={[styles.optionLabel, { color: gender === g ? theme.primary : theme.text }]}>
                      {g === "male" ? "Male" : "Female"}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[styles.label, { color: theme.subtext, marginTop: spacing.lg }]}>Age</Text>
              <TextInput
                placeholder="Age"
                placeholderTextColor={theme.subtext}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
              />
            </View>
          )}

          {step === "body" && (
            <View>
              <Text style={[styles.title, { color: theme.text }]}>Your body stats</Text>
              <Text style={[styles.subtitle, { color: theme.subtext }]}>
                Used to calculate your BMI and daily calorie target.
              </Text>
              <Text style={[styles.label, { color: theme.subtext }]}>Height (cm)</Text>
              <TextInput
                placeholder="e.g. 170"
                placeholderTextColor={theme.subtext}
                value={heightCm}
                onChangeText={setHeightCm}
                keyboardType="numeric"
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
              />
              <Text style={[styles.label, { color: theme.subtext }]}>Current weight (kg)</Text>
              <TextInput
                placeholder="e.g. 70"
                placeholderTextColor={theme.subtext}
                value={weightKg}
                onChangeText={setWeightKg}
                keyboardType="numeric"
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
              />
              <Text style={[styles.label, { color: theme.subtext }]}>Target weight (kg)</Text>
              <TextInput
                placeholder="e.g. 65"
                placeholderTextColor={theme.subtext}
                value={targetWeightKg}
                onChangeText={setTargetWeightKg}
                keyboardType="numeric"
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
              />
              {heightNum > 0 && weightNum > 0 && (
                <Text style={[styles.bmiHint, { color: theme.info }]}>
                  Your BMI: {(weightNum / ((heightNum / 100) * (heightNum / 100))).toFixed(1)}
                </Text>
              )}
            </View>
          )}

          {step === "activity" && (
            <View>
              <Text style={[styles.title, { color: theme.text }]}>How often can you train?</Text>
              <Text style={[styles.subtitle, { color: theme.subtext }]}>
                Be honest - this sets your activity level, not a goal to force yourself into.
              </Text>
              <View style={styles.stepperRow}>
                <Pressable
                  onPress={() => setWorkoutsPerWeek((n) => Math.max(0, n - 1))}
                  style={[styles.stepperButton, { borderColor: theme.border }]}
                >
                  <Feather name="minus" size={20} color={theme.text} />
                </Pressable>
                <Text style={[styles.stepperValue, { color: theme.text }]}>{workoutsPerWeek}</Text>
                <Pressable
                  onPress={() => setWorkoutsPerWeek((n) => Math.min(7, n + 1))}
                  style={[styles.stepperButton, { borderColor: theme.border }]}
                >
                  <Feather name="plus" size={20} color={theme.text} />
                </Pressable>
              </View>
              <Text style={[styles.stepperCaption, { color: theme.subtext }]}>
                workouts per week
              </Text>
            </View>
          )}

          {step === "goal" && (
            <View>
              <Text style={[styles.title, { color: theme.text }]}>What's your main goal?</Text>
              <Text style={[styles.subtitle, { color: theme.subtext }]}>
                This changes your calorie target and protein needs. Pick Lose Fat + Build Muscle together if you want body recomposition.
              </Text>
              {(Object.keys(GOAL_LABELS) as FitnessGoal[]).map((g) => {
                const selected = goals.includes(g);
                return (
                  <Pressable
                    key={g}
                    onPress={() => toggleGoal(g)}
                    style={[
                      styles.goalCard,
                      {
                        backgroundColor: selected ? `${theme.primary}22` : theme.surface,
                        borderColor: selected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <View style={[styles.goalIconBadge, { backgroundColor: `${theme.primary}1F` }]}>
                      <Feather name={GOAL_LABELS[g].icon} size={20} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.goalTitle, { color: theme.text }]}>{GOAL_LABELS[g].title}</Text>
                      <Text style={[styles.goalBlurb, { color: theme.subtext }]}>{GOAL_LABELS[g].blurb}</Text>
                    </View>
                    <Feather
                      name={selected ? "check-square" : "square"}
                      size={20}
                      color={selected ? theme.primary : theme.subtext}
                    />
                  </Pressable>
                );
              })}
              {goals.includes("loseFat") && goals.includes("buildMuscle") && (
                <Text style={[styles.bmiHint, { color: theme.primary }]}>
                  Body recomposition mode: a mild deficit with high protein to lose fat and build muscle at the same time.
                </Text>
              )}
              {goals.length === 0 && (
                <Text style={[styles.bmiHint, { color: theme.subtext }]}>
                  Pick at least one goal to continue.
                </Text>
              )}
            </View>
          )}

          {step === "summary" && (
            <View>
              <Text style={[styles.title, { color: theme.text }]}>Your personalized plan</Text>
              <Text style={[styles.subtitle, { color: theme.subtext }]}>
                Based on what you told us. You can always tweak these later in Settings.
              </Text>
              <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <SummaryRow label="Daily calories" value={`${projectedGoals.calorieGoal} kcal`} color={theme.warning} />
                <SummaryRow label="Protein" value={`${projectedGoals.proteinGoal} g`} color={theme.success} />
                <SummaryRow label="Carbs" value={`${projectedGoals.carbGoal} g`} color={theme.primary} />
                <SummaryRow label="Fats" value={`${projectedGoals.fatGoal} g`} color={theme.danger} />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          {stepIndex > 0 && (
            <Pressable onPress={goBack} style={[styles.backButton, { borderColor: theme.border }]}>
              <Text style={{ color: theme.text, fontWeight: "600" }}>Back</Text>
            </Pressable>
          )}
          {step !== "summary" ? (
            <Pressable
              onPress={goNext}
              disabled={step === "goal" && goals.length === 0}
              style={[
                styles.nextButton,
                { backgroundColor: theme.primary, opacity: step === "goal" && goals.length === 0 ? 0.5 : 1 },
              ]}
            >
              <Text style={styles.nextButtonText}>Continue</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </Pressable>
          ) : (
            <Pressable
              onPress={handleFinish}
              disabled={saving}
              style={[styles.nextButton, { backgroundColor: theme.primary, opacity: saving ? 0.6 : 1 }]}
            >
              <Text style={styles.nextButtonText}>{saving ? "Setting up..." : "Start Using FitPro"}</Text>
              <Feather name="check" size={18} color="#fff" />
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value, color }: { label: string; value: string; color: string }) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryRowLeft}>
        <View style={[styles.summaryDot, { backgroundColor: color }]} />
        <Text style={{ color: theme.subtext }}>{label}</Text>
      </View>
      <Text style={[styles.summaryValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xl, flexGrow: 1 },
  progressRow: { flexDirection: "row", gap: 6, marginBottom: spacing.xl, marginTop: spacing.sm },
  progressDot: { flex: 1, height: 4, borderRadius: 2 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: spacing.xs },
  subtitle: { fontSize: 14, marginBottom: spacing.lg, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: spacing.xs, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  optionRow: { flexDirection: "row", gap: spacing.sm },
  optionCard: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: "center",
    gap: spacing.xs,
  },
  optionLabel: { fontSize: 15, fontWeight: "700" },
  bmiHint: { fontSize: 13, fontWeight: "600", marginTop: spacing.sm },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xl,
    marginTop: spacing.lg,
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: { fontSize: 40, fontWeight: "800", minWidth: 60, textAlign: "center" },
  stepperCaption: { textAlign: "center", marginTop: spacing.sm, fontSize: 13 },
  goalCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  goalIconBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  goalTitle: { fontSize: 15, fontWeight: "700" },
  goalBlurb: { fontSize: 12, marginTop: 2 },
  summaryCard: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.sm },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  summaryRowLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  summaryDot: { width: 10, height: 10, borderRadius: 5 },
  summaryValue: { fontWeight: "700", fontSize: 15 },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
  },
  backButton: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButton: {
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
