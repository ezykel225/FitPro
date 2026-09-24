// app/(tabs)/workout.tsx
// WORKOUT SCREEN
// The Mon-Fri PPL plan. Opens on today's day, shows this week's
// double-progression targets for every exercise, lets you log each set,
// swap exercises you can't do, run the rest timer, and log the session.

import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { showAlert } from "../../services/alert";
import Header from "../../components/Header";
import Card from "../../components/Card";
import ProgressBar from "../../components/ProgressBar";
import ExerciseCard from "../../components/ExerciseCard";
import SwapSheet from "../../components/SwapSheet";
import { useAppTheme } from "../../context/ThemeContext";
import { useWorkout, SlotView } from "../../hooks/useWorkout";
import { useAchievements } from "../../hooks/useAchievements";
import { useNutrition } from "../../hooks/useNutrition";
import { WORKOUT_PLAN } from "../../constants/plan";
import { spacing, radius } from "../../constants/theme";

export default function WorkoutScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const {
    loading,
    week,
    todayKey,
    selectedDay,
    selectedDayKey,
    setSelectedDayKey,
    slotViews,
    completionPercent,
    loggedToday,
    updateSet,
    toggleSetDone,
    addSet,
    removeSet,
    toggleTempo,
    swapExercise,
    startRest,
    skipRest,
    isResting,
    restSecondsLeft,
    logWorkout,
    totalWorkoutsCompleted,
    streak,
  } = useWorkout();

  const { checkAndUnlock, recentlyUnlocked, clearRecentlyUnlocked } = useAchievements();
  const { todaysMeals } = useNutrition();
  const [swapView, setSwapView] = useState<SlotView | null>(null);
  const [showHowTo, setShowHowTo] = useState(false);

  useEffect(() => {
    if (recentlyUnlocked) {
      showAlert("Badge Unlocked! " + recentlyUnlocked.emoji, recentlyUnlocked.title, [
        { text: "Nice!", onPress: clearRecentlyUnlocked },
      ]);
    }
  }, [recentlyUnlocked, clearRecentlyUnlocked]);

  const handleFinishWorkout = async () => {
    const wasLogged = loggedToday;
    await logWorkout();
    const full = completionPercent === 100;
    await checkAndUnlock({
      currentStreak: streak.currentStreak + (full && !wasLogged ? 1 : 0),
      totalWorkoutsCompleted: totalWorkoutsCompleted + (full && !wasLogged ? 1 : 0),
      totalMealsLogged: todaysMeals.length,
    });
    showAlert(
      "Workout Logged",
      full
        ? "Every set done. Next week's targets are updated from today's numbers."
        : `Saved at ${completionPercent}%. Next week's targets use the sets you ticked.`
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </SafeAreaView>
    );
  }

  const isRestDay = todayKey === null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Header
          title="Workout"
          subtitle={`PPL plan · Week ${week}`}
          rightSlot={
            <Pressable
              onPress={() => setShowHowTo((s) => !s)}
              style={[styles.helpButton, { borderColor: theme.border }]}
              accessibilityLabel="How progression works"
            >
              <Feather name="help-circle" size={18} color={theme.subtext} />
            </Pressable>
          }
        />

        {showHowTo ? (
          <Card>
            <Text style={[styles.howTitle, { color: theme.text }]}>How your targets change each week</Text>
            <Text style={[styles.howText, { color: theme.subtext }]}>
              <Text style={{ fontWeight: "700", color: theme.text }}>Dumbbells (double progression):</Text> keep the
              same weight and add reps until every set hits the top of the range. Then level up: heavier dumbbells →
              slow 3-4s lowering (once you're at 20lb) → a 4th set → rest 60s instead of 90s.{"\n\n"}
              <Text style={{ fontWeight: "700", color: theme.text }}>Push-ups (AMRAP):</Text> beat last session's reps.
              At 20+ clean reps, go to a narrower grip or add a backpack.{"\n\n"}
              <Text style={{ fontWeight: "700", color: theme.text }}>Holds:</Text> seconds go up automatically every
              week.{"\n\n"}
              Tap ✓ to tick a set. Leave a box empty and ✓ fills in today's target. Missed a day? Just do it the next
              day.
            </Text>
          </Card>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow}>
          {WORKOUT_PLAN.map((day) => {
            const active = day.key === selectedDayKey;
            const isToday = day.key === todayKey;
            return (
              <Pressable
                key={day.key}
                onPress={() => setSelectedDayKey(day.key)}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: active ? theme.primary : theme.surface,
                    borderColor: isToday && !active ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text style={[styles.tabDay, { color: active ? "#fff" : theme.subtext }]}>
                  {isToday ? "TODAY" : day.shortLabel.toUpperCase()}
                </Text>
                <Text style={[styles.tabLabel, { color: active ? "#fff" : theme.text }]}>
                  {day.emoji} {day.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {isRestDay ? (
          <Card style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Text style={{ fontSize: 28 }}>🌤️</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.dayTitle, { color: theme.text, marginBottom: 2 }]}>Rest day</Text>
              <Text style={{ color: theme.subtext, fontSize: 13 }}>
                Recover, or go for an easy walk. Missed a weekday? You can still do it now.
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/run")}
              style={[styles.walkButton, { backgroundColor: theme.primary }]}
            >
              <Feather name="navigation" size={14} color="#fff" />
              <Text style={styles.walkButtonText}>Walk</Text>
            </Pressable>
          </Card>
        ) : null}

        <Card>
          <Text style={[styles.dayTitle, { color: theme.text }]}>
            {selectedDay.emoji} {selectedDay.shortLabel} · {selectedDay.label}
          </Text>
          <Text style={[styles.focus, { color: theme.subtext }]}>{selectedDay.focus}</Text>
          <ProgressBar percent={completionPercent} label="Sets done" color={theme.success} />
          {loggedToday ? (
            <Text style={[styles.loggedNote, { color: theme.success }]}>✓ Logged today. Changes you make update it.</Text>
          ) : null}
        </Card>

        {slotViews.map((view) => (
          <ExerciseCard
            key={`${view.slot.id}-${view.exercise.id}`}
            view={view}
            week={week}
            onUpdateSet={updateSet}
            onToggleSet={toggleSetDone}
            onAddSet={addSet}
            onRemoveSet={removeSet}
            onToggleTempo={toggleTempo}
            onStartRest={startRest}
            onSwap={setSwapView}
          />
        ))}

        <Pressable
          onPress={handleFinishWorkout}
          style={[styles.finishButton, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.finishButtonText}>{loggedToday ? "Update Today's Log" : "Finish & Log Workout"}</Text>
        </Pressable>
      </ScrollView>

      {isResting ? (
        <View style={[styles.restBar, { backgroundColor: theme.surfaceAlt, borderColor: theme.primary }]}>
          <Feather name="watch" size={18} color={theme.primary} />
          <Text style={[styles.restLabel, { color: theme.subtext }]}>REST</Text>
          <Text style={[styles.restTime, { color: theme.text }]}>
            {Math.floor(restSecondsLeft / 60)}:{String(restSecondsLeft % 60).padStart(2, "0")}
          </Text>
          <Pressable onPress={() => startRest(restSecondsLeft + 15)} style={styles.restAction}>
            <Text style={{ color: theme.primary, fontWeight: "700" }}>+15s</Text>
          </Pressable>
          <Pressable onPress={skipRest} style={styles.restAction}>
            <Text style={{ color: theme.danger, fontWeight: "700" }}>Skip</Text>
          </Pressable>
        </View>
      ) : null}

      <SwapSheet view={swapView} week={week} onPick={swapExercise} onClose={() => setSwapView(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.md, paddingBottom: 110 },
  helpButton: { borderWidth: 1, borderRadius: radius.pill, padding: 8 },
  howTitle: { fontSize: 15, fontWeight: "700", marginBottom: spacing.sm },
  howText: { fontSize: 13, lineHeight: 19 },
  tabsRow: { marginBottom: spacing.md, flexGrow: 0 },
  tabChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    marginRight: spacing.sm,
    alignItems: "center",
  },
  tabDay: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  tabLabel: { fontSize: 13, fontWeight: "700", marginTop: 2 },
  dayTitle: { fontSize: 18, fontWeight: "800", marginBottom: 2 },
  focus: { fontSize: 13, marginBottom: spacing.sm },
  loggedNote: { fontSize: 12, fontWeight: "600", marginTop: spacing.xs },
  walkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  walkButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  finishButton: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  finishButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  restBar: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  restLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  restTime: { fontSize: 22, fontWeight: "800", flex: 1, fontVariant: ["tabular-nums"] },
  restAction: { paddingHorizontal: 8, paddingVertical: 4 },
});
