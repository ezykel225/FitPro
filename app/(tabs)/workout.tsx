// app/(tabs)/workout.tsx
// WORKOUT SCREEN
// Lets the user pick a daily workout plan (Push/Pull/Legs/Upper/Full Body),
// mark exercises complete, run a rest timer, and log the session.

import React, { useEffect } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import Card from "../../components/Card";
import ProgressBar from "../../components/ProgressBar";
import WorkoutCard from "../../components/WorkoutCard";
import { useAppTheme } from "../../context/ThemeContext";
import { useWorkout } from "../../hooks/useWorkout";
import { useAchievements } from "../../hooks/useAchievements";
import { useNutrition } from "../../hooks/useNutrition";
import { spacing, radius } from "../../constants/theme";
import { WorkoutDayKey } from "../../constants/types";

const DAY_TABS: { key: WorkoutDayKey; label: string }[] = [
  { key: "push", label: "Push" },
  { key: "pull", label: "Pull" },
  { key: "legs", label: "Legs" },
  { key: "upper", label: "Upper" },
  { key: "fullBody", label: "Full Body" },
];

export default function WorkoutScreen() {
  const { theme } = useAppTheme();
  const {
    loading,
    workoutDays,
    selectedDay,
    selectedDayKey,
    setSelectedDayKey,
    completionPercent,
    toggleExercise,
    startRest,
    skipRest,
    isResting,
    restSecondsLeft,
    logTodayWorkout,
    totalWorkoutsCompleted,
    streak,
  } = useWorkout();

  const { checkAndUnlock, recentlyUnlocked, clearRecentlyUnlocked } = useAchievements();
  const { todaysMeals } = useNutrition();

  useEffect(() => {
    if (recentlyUnlocked) {
      Alert.alert("Badge Unlocked! " + recentlyUnlocked.emoji, recentlyUnlocked.title, [
        { text: "Nice!", onPress: clearRecentlyUnlocked },
      ]);
    }
  }, [recentlyUnlocked, clearRecentlyUnlocked]);

  const handleFinishWorkout = async () => {
    await logTodayWorkout();
    await checkAndUnlock({
      currentStreak: streak.currentStreak + (completionPercent === 100 ? 1 : 0),
      totalWorkoutsCompleted: totalWorkoutsCompleted + (completionPercent === 100 ? 1 : 0),
      totalMealsLogged: todaysMeals.length,
    });
    Alert.alert("Workout Logged", "Nice work. Your progress has been saved.");
  };

  if (loading || !selectedDay) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header title="Workout" subtitle="Pick a plan, tick boxes, done." />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow}>
          {DAY_TABS.map((tab) => {
            const active = tab.key === selectedDayKey;
            const dayData = workoutDays.find((d) => d.key === tab.key);
            return (
              <Pressable
                key={tab.key}
                onPress={() => setSelectedDayKey(tab.key)}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: active ? theme.primary : theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={{ fontSize: 14 }}>{dayData?.emoji}</Text>
                <Text
                  style={[
                    styles.tabLabel,
                    { color: active ? "#fff" : theme.text },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Card>
          <Text style={[styles.dayTitle, { color: theme.text }]}>
            {selectedDay.emoji} {selectedDay.label}
          </Text>
          <ProgressBar percent={completionPercent} label="Completion" color={theme.success} />
        </Card>

        {isResting && (
          <Card style={{ alignItems: "center" }}>
            <Text style={[styles.restLabel, { color: theme.subtext }]}>RESTING</Text>
            <Text style={[styles.restTime, { color: theme.primary }]}>{restSecondsLeft}s</Text>
            <Pressable onPress={skipRest} style={styles.skipButton}>
              <Text style={{ color: theme.danger, fontWeight: "600" }}>Skip Rest</Text>
            </Pressable>
          </Card>
        )}

        <Card>
          {selectedDay.exercises.map((exercise) => (
            <WorkoutCard
              key={exercise.id}
              exercise={exercise}
              onToggle={toggleExercise}
              onStartRest={startRest}
            />
          ))}
        </Card>

        <Pressable
          onPress={handleFinishWorkout}
          style={[styles.finishButton, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.finishButtonText}>Finish & Log Workout</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  tabsRow: { marginBottom: spacing.md },
  tabChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  tabLabel: { fontSize: 13, fontWeight: "600" },
  dayTitle: { fontSize: 18, fontWeight: "700", marginBottom: spacing.sm },
  restLabel: { fontSize: 12, letterSpacing: 1, marginBottom: 4 },
  restTime: { fontSize: 36, fontWeight: "800", marginBottom: spacing.sm },
  skipButton: { padding: spacing.sm },
  finishButton: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  finishButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
