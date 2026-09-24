// app/activity/[id].tsx
// ACTIVITY DETAIL
// A finished walk/run: route map, summary stats, and per-km splits.

import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Card from "../../components/Card";
import RouteMap from "../../components/RouteMap";
import { useAppTheme } from "../../context/ThemeContext";
import { Activity } from "../../constants/types";
import { getItem, setItem, STORAGE_KEYS } from "../../services/storage";
import { activityTitle, formatDuration, formatKm, formatPace } from "../../services/geo";
import { showAlert } from "../../services/alert";
import { spacing, radius } from "../../constants/theme";

export default function ActivityDetailScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activity, setActivity] = useState<Activity | null | undefined>(undefined);

  useEffect(() => {
    getItem<Activity[]>(STORAGE_KEYS.ACTIVITIES, []).then((all) => setActivity(all.find((a) => a.id === id) ?? null));
  }, [id]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/run"));

  const handleDelete = () => {
    showAlert("Delete activity?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const all = await getItem<Activity[]>(STORAGE_KEYS.ACTIVITIES, []);
          await setItem(
            STORAGE_KEYS.ACTIVITIES,
            all.filter((a) => a.id !== id)
          );
          goBack();
        },
      },
    ]);
  };

  if (activity === undefined) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </SafeAreaView>
    );
  }

  const fastestSplit = activity && activity.splits.length > 0 ? Math.min(...activity.splits) : 0;
  const slowestSplit = activity && activity.splits.length > 0 ? Math.max(...activity.splits) : 0;
  const started = activity ? new Date(activity.startedAt) : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.topBar}>
        <Pressable onPress={goBack} style={styles.iconButton} accessibilityLabel="Back">
          <Feather name="arrow-left" size={22} color={theme.text} />
        </Pressable>
        {activity ? (
          <Pressable onPress={handleDelete} style={styles.iconButton} accessibilityLabel="Delete activity">
            <Feather name="trash-2" size={20} color={theme.danger} />
          </Pressable>
        ) : null}
      </View>

      {!activity ? (
        <View style={styles.center}>
          <Text style={{ color: theme.subtext }}>Activity not found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>{activityTitle(activity)}</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>
            {started?.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })} ·{" "}
            {started?.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
          </Text>

          <RouteMap segments={activity.segments} height={280} />

          <View style={styles.statGrid}>
            <Stat label="Distance" value={`${formatKm(activity.distanceM)} km`} />
            <Stat label="Moving time" value={formatDuration(activity.movingSeconds)} />
            <Stat label="Avg pace" value={`${formatPace(activity.movingSeconds, activity.distanceM)} /km`} />
            <Stat label="Calories" value={`${activity.calories} kcal`} />
          </View>

          {activity.splits.length > 0 ? (
            <Card>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Splits</Text>
              {activity.splits.map((s, i) => {
                // Bar length: faster km = longer bar.
                const range = slowestSplit - fastestSplit || 1;
                const pct = 55 + (45 * (slowestSplit - s)) / range;
                return (
                  <View key={i} style={styles.splitRow}>
                    <Text style={[styles.splitKm, { color: theme.subtext }]}>{i + 1}</Text>
                    <View style={styles.splitBarTrack}>
                      <View
                        style={[
                          styles.splitBar,
                          { width: `${pct}%`, backgroundColor: s === fastestSplit ? "#FC4C02" : theme.primary },
                        ]}
                      />
                    </View>
                    <Text style={[styles.splitTime, { color: theme.text }]}>{formatDuration(s)}</Text>
                  </View>
                );
              })}
            </Card>
          ) : (
            <Text style={{ color: theme.subtext, fontSize: 13 }}>Splits appear once you cover a full kilometre.</Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { theme } = useAppTheme();
  return (
    <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={{ color: theme.subtext, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: theme.text, fontSize: 20, fontWeight: "800", marginTop: 2 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  topBar: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: spacing.sm },
  iconButton: { padding: spacing.sm },
  content: { padding: spacing.md, paddingTop: 0, paddingBottom: spacing.xl },
  title: { fontSize: 26, fontWeight: "900" },
  subtitle: { fontSize: 13, marginBottom: spacing.md, marginTop: 2 },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginVertical: spacing.md },
  statBox: { flexBasis: "47%", flexGrow: 1, borderWidth: 1, borderRadius: radius.md, padding: spacing.sm + 4 },
  cardTitle: { fontSize: 15, fontWeight: "700", marginBottom: spacing.sm },
  splitRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 4 },
  splitKm: { width: 20, fontWeight: "700" },
  splitBarTrack: { flex: 1 },
  splitBar: { height: 10, borderRadius: 5 },
  splitTime: { width: 56, textAlign: "right", fontWeight: "700", fontVariant: ["tabular-nums"] },
});
