// app/(tabs)/progress.tsx
// PROGRESS SCREEN
// Weight tracking with a line chart (react-native-chart-kit), goal
// progress, and basic body statistics.

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineChart } from "react-native-chart-kit";
import Header from "../../components/Header";
import Card from "../../components/Card";
import ProgressBar from "../../components/ProgressBar";
import { useAppTheme } from "../../context/ThemeContext";
import { useProgress } from "../../hooks/useProgress";
import { spacing, radius } from "../../constants/theme";
import { FitnessGoal } from "../../constants/types";

const screenWidth = Dimensions.get("window").width;

const GOAL_LABELS: Record<FitnessGoal, string> = {
  loseFat: "Lose Fat",
  buildMuscle: "Build Muscle",
  maintain: "Maintain",
};

export default function ProgressScreen() {
  const { theme } = useAppTheme();
  const {
    loading,
    chartData,
    latestWeight,
    profile,
    addWeightEntry,
    goalProgressPercent,
  } = useProgress();
  const [weightInput, setWeightInput] = useState("");

  const handleLogWeight = async () => {
    const weight = parseFloat(weightInput);
    if (Number.isNaN(weight) || weight <= 0) {
      Alert.alert("Invalid weight", "Please enter a valid weight in kg.");
      return;
    }
    await addWeightEntry(weight);
    setWeightInput("");
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </SafeAreaView>
    );
  }

  const hasChartData = chartData.length >= 2;
  const goalLabel = profile.goals.map((g) => GOAL_LABELS[g]).join(" + ") || "Maintain";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header title="Progress" subtitle="The scale doesn't lie, but it also doesn't judge." />

        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Weight Trend (last 7 logs)</Text>
          {hasChartData ? (
            <LineChart
              data={{
                labels: chartData.map((e) => e.date.slice(5)), // MM-DD
                datasets: [{ data: chartData.map((e) => e.weightKg) }],
              }}
              width={screenWidth - spacing.md * 4}
              height={200}
              yAxisSuffix="kg"
              chartConfig={{
                backgroundColor: theme.surface,
                backgroundGradientFrom: theme.surface,
                backgroundGradientTo: theme.surface,
                decimalPlaces: 1,
                color: () => theme.primary,
                labelColor: () => theme.subtext,
                propsForDots: { r: "4", strokeWidth: "2", stroke: theme.primary },
              }}
              bezier
              style={{ borderRadius: radius.md }}
            />
          ) : (
            <Text style={{ color: theme.subtext }}>
              Log at least 2 weigh-ins to see your trend chart.
            </Text>
          )}
        </Card>

        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Log Today's Weight</Text>
          <View style={styles.row}>
            <TextInput
              placeholder="Weight in kg"
              placeholderTextColor={theme.subtext}
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="numeric"
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            />
            <Pressable
              onPress={handleLogWeight}
              style={[styles.logButton, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.logButtonText}>Log</Text>
            </Pressable>
          </View>
        </Card>

        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Goal Tracking</Text>
          <Text style={{ color: theme.subtext, marginBottom: spacing.sm }}>
            Current: {latestWeight ?? "--"} kg · Target: {profile.targetWeightKg} kg
          </Text>
          <ProgressBar percent={goalProgressPercent} label="Progress to goal" color={theme.success} />
        </Card>

        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Body Statistics</Text>
          <Text style={{ color: theme.text, marginBottom: 4 }}>Height: {profile.heightCm} cm</Text>
          <Text style={{ color: theme.text, marginBottom: 4 }}>
            Starting weight: {profile.startingWeightKg} kg
          </Text>
          <Text style={{ color: theme.text, marginBottom: 4 }}>Goal: {goalLabel}</Text>
          {(() => {
            const weightForBmi = latestWeight ?? profile.startingWeightKg;
            const heightM = profile.heightCm / 100;
            const bmi = heightM > 0 ? weightForBmi / (heightM * heightM) : 0;
            const category =
              bmi < 18.5 ? "Underweight" : bmi < 25 ? "Healthy range" : bmi < 30 ? "Overweight" : "Obese";
            return (
              <Text style={{ color: theme.info, fontWeight: "600" }}>
                BMI: {bmi.toFixed(1)} ({category})
              </Text>
            );
          })()}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: spacing.sm },
  row: { flexDirection: "row", gap: spacing.sm },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
  },
  logButton: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
  },
  logButtonText: { color: "#fff", fontWeight: "700" },
});