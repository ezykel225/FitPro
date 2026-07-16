// app/(tabs)/index.tsx
// HOME SCREEN
// Hero gradient card (greeting + today's motivation + streak) up top as
// the one bold moment on the page, then a quiet stat row, snapshot card,
// and quick actions below. Icons throughout are Feather vector icons.

import React from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Card from "../../components/Card";
import ProgressBar from "../../components/ProgressBar";
import StatPill from "../../components/StatPill";
import Navigation from "../../components/Navigation";
import { useAppTheme } from "../../context/ThemeContext";
import { useWorkout } from "../../hooks/useWorkout";
import { useNutrition } from "../../hooks/useNutrition";
import { getQuoteForToday } from "../../constants/data";
import { spacing, radius, gradients } from "../../constants/theme";

export default function HomeScreen() {
  const { theme } = useAppTheme();
  const { completionPercent, streak, loading: workoutLoading } = useWorkout();
  const { todaysTotals, goals, loading: nutritionLoading } = useNutrition();

  const loading = workoutLoading || nutritionLoading;
  const quote = getQuoteForToday();

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero: the one bold moment on this screen */}
        <LinearGradient
          colors={gradients.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTopRow}>
            <Text style={styles.heroGreeting}>Hey there 👋</Text>
            <View style={styles.streakChip}>
              <Feather name="zap" size={14} color="#fff" />
              <Text style={styles.streakChipText}>{streak.currentStreak} day streak</Text>
            </View>
          </View>
          <Text style={styles.heroSubtitle}>Let's do the minimum effective dose today.</Text>
          <View style={styles.heroDivider} />
          <Text style={styles.heroQuoteLabel}>TODAY'S MOTIVATION</Text>
          <Text style={styles.heroQuote}>"{quote}"</Text>
        </LinearGradient>

        <View style={styles.statsRow}>
          <StatPill icon="zap" accentColor={theme.primary} value={streak.currentStreak} label="Day Streak" />
          <StatPill icon="coffee" accentColor={theme.warning} value={todaysTotals.calories} label="Calories Today" />
          <StatPill icon="check-circle" accentColor={theme.success} value={`${completionPercent}%`} label="Workout Done" />
        </View>

        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Today's Snapshot</Text>
          <ProgressBar
            percent={completionPercent}
            label="Workout completion"
            color={theme.success}
          />
          <ProgressBar
            percent={
              goals.calorieGoal > 0
                ? Math.round((todaysTotals.calories / goals.calorieGoal) * 100)
                : 0
            }
            label={`Calories (${todaysTotals.calories} / ${goals.calorieGoal} kcal)`}
            color={theme.warning}
          />
        </Card>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
        <Navigation />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  hero: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroGreeting: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
  },
  streakChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  streakChipText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    marginTop: 4,
  },
  heroDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginVertical: spacing.md,
  },
  heroQuoteLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroQuote: {
    color: "#fff",
    fontSize: 15,
    fontStyle: "italic",
    lineHeight: 21,
  },
  statsRow: { flexDirection: "row", marginBottom: spacing.md },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: spacing.sm },
});
