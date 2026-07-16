// app/(tabs)/achievements.tsx
// ACHIEVEMENTS SCREEN
// Displays unlockable badges, streak milestones, and total workouts
// completed. Badges are unlocked automatically by useAchievements
// whenever the user finishes a workout or logs a meal.

import React from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import Card from "../../components/Card";
import StatPill from "../../components/StatPill";
import { useAppTheme } from "../../context/ThemeContext";
import { useAchievements } from "../../hooks/useAchievements";
import { useWorkout } from "../../hooks/useWorkout";
import { spacing, radius } from "../../constants/theme";

export default function AchievementsScreen() {
  const { theme } = useAppTheme();
  const { loading, badges, unlockedCount } = useAchievements();
  const { streak, totalWorkoutsCompleted } = useWorkout();

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
        <Header title="Achievements" subtitle="Proof that you actually did the thing." />

        <View style={styles.statsRow}>
          <StatPill icon="award" accentColor={theme.success} value={`${unlockedCount}/${badges.length}`} label="Badges" />
          <StatPill icon="zap" accentColor={theme.primary} value={streak.longestStreak} label="Best Streak" />
          <StatPill icon="activity" accentColor={theme.info} value={totalWorkoutsCompleted} label="Workouts Done" />
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>All Badges</Text>
        <View style={styles.grid}>
          {badges.map((badge) => (
            <Card
              key={badge.id}
              style={{
                width: "48%",
                alignItems: "center",
                opacity: badge.unlocked ? 1 : 0.4,
              }}
            >
              <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
              <Text style={[styles.badgeTitle, { color: theme.text }]}>{badge.title}</Text>
              <Text style={[styles.badgeDesc, { color: theme.subtext }]}>{badge.description}</Text>
              {!badge.unlocked && (
                <Text style={[styles.lockedTag, { color: theme.subtext }]}>🔒 Locked</Text>
              )}
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  statsRow: { flexDirection: "row", marginBottom: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: spacing.sm },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  badgeEmoji: { fontSize: 32, marginBottom: 6 },
  badgeTitle: { fontSize: 14, fontWeight: "700", textAlign: "center" },
  badgeDesc: { fontSize: 11, textAlign: "center", marginTop: 4 },
  lockedTag: { fontSize: 10, marginTop: 6, fontWeight: "600" },
});
