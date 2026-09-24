// app/(tabs)/run.tsx
// RUN / WALK SCREEN (Strava-style GPS tracker)
// Idle: pick Walk or Run, hit Start, see this week's totals and past activities.
// Tracking: live map, time, distance, pace, splits, pause / resume / finish.

import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Header from "../../components/Header";
import Card from "../../components/Card";
import RouteMap from "../../components/RouteMap";
import RouteShape from "../../components/RouteShape";
import { useAppTheme } from "../../context/ThemeContext";
import { useActivityTracker } from "../../hooks/useActivityTracker";
import { showAlert } from "../../services/alert";
import { activityTitle, formatDuration, formatKm, formatPace } from "../../services/geo";
import { mondayOf, parseLocalISO, shortDate, localISO } from "../../services/dates";
import { ActivityType } from "../../constants/types";
import { spacing, radius } from "../../constants/theme";

const STRAVA_ORANGE = "#FC4C02";

export default function RunScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const tracker = useActivityTracker();
  const [type, setType] = useState<ActivityType>("walk");
  const [starting, setStarting] = useState(false);

  const weekTotals = useMemo(() => {
    const monday = parseLocalISO(mondayOf()).getTime();
    const thisWeek = tracker.activities.filter((a) => new Date(a.startedAt).getTime() >= monday);
    return {
      count: thisWeek.length,
      distanceM: thisWeek.reduce((n, a) => n + a.distanceM, 0),
      seconds: thisWeek.reduce((n, a) => n + a.movingSeconds, 0),
    };
  }, [tracker.activities]);

  const recent = useMemo(() => [...tracker.activities].reverse(), [tracker.activities]);

  if (tracker.loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </SafeAreaView>
    );
  }

  const handleStart = async () => {
    setStarting(true);
    const ok = await tracker.start(type);
    setStarting(false);
    if (!ok) {
      showAlert(
        "Location needed",
        "FitPro needs your location to track distance. On iPhone: Settings → Privacy & Security → Location Services → Safari Websites → While Using."
      );
    }
  };

  const handleFinish = () => {
    showAlert("Finish activity?", "This saves it to your history.", [
      { text: "Keep going", style: "cancel" },
      {
        text: "Finish",
        onPress: async () => {
          const saved = await tracker.finish();
          if (saved) router.push(`/activity/${saved.id}`);
          else showAlert("Too short", "Activities under 10 seconds aren't saved.");
        },
      },
    ]);
  };

  const handleDiscard = () => {
    showAlert("Discard activity?", "This activity won't be saved.", [
      { text: "Cancel", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: tracker.discard },
    ]);
  };

  // ---------- Live tracking ----------
  if (tracker.status !== "idle") {
    const paused = tracker.status === "paused";
    const acc = tracker.gps.accuracy;
    const gpsLabel = acc === null ? "Searching…" : acc <= 15 ? "GPS strong" : acc <= 35 ? "GPS ok" : "GPS weak";
    const gpsColor = acc === null ? theme.subtext : acc <= 15 ? theme.success : acc <= 35 ? theme.warning : theme.danger;

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.liveHeader}>
            <Text style={[styles.liveTitle, { color: theme.text }]}>
              {tracker.type === "run" ? "🏃 Run" : "🚶 Walk"}
              {paused ? "  ·  Paused" : ""}
            </Text>
            <View style={[styles.gpsChip, { borderColor: gpsColor }]}>
              <View style={[styles.gpsDot, { backgroundColor: gpsColor }]} />
              <Text style={[styles.gpsText, { color: gpsColor }]}>{gpsLabel}</Text>
            </View>
          </View>

          {tracker.gps.error ? (
            <Text style={[styles.error, { color: theme.danger }]}>{tracker.gps.error}</Text>
          ) : null}

          <RouteMap segments={tracker.segments} height={260} follow />

          <View style={styles.bigStat}>
            <Text style={[styles.bigValue, { color: theme.text }]}>{formatDuration(tracker.movingSeconds)}</Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>TIME</Text>
          </View>

          <View style={styles.statGrid}>
            <Stat label="KM" value={formatKm(tracker.distanceM)} />
            <Stat label="AVG PACE /KM" value={formatPace(tracker.movingSeconds, tracker.distanceM)} />
            <Stat
              label="CURRENT PACE"
              value={tracker.currentPace ? formatPace(tracker.currentPace.seconds, tracker.currentPace.meters) : "--:--"}
            />
            <Stat label="KCAL" value={String(tracker.calories)} />
          </View>

          {tracker.splits.length > 0 ? (
            <Card>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Splits</Text>
              {tracker.splits.map((s, i) => (
                <View key={i} style={styles.splitRow}>
                  <Text style={{ color: theme.subtext }}>Km {i + 1}</Text>
                  <Text style={{ color: theme.text, fontWeight: "700" }}>{formatDuration(s)} /km</Text>
                </View>
              ))}
            </Card>
          ) : null}

          <View style={styles.controls}>
            {paused ? (
              <>
                <Pressable onPress={handleDiscard} style={[styles.sideButton, { borderColor: theme.border }]}>
                  <Feather name="trash-2" size={20} color={theme.danger} />
                </Pressable>
                <Pressable onPress={tracker.resume} style={[styles.mainButton, { backgroundColor: theme.success }]}>
                  <Feather name="play" size={26} color="#fff" />
                  <Text style={styles.mainButtonText}>Resume</Text>
                </Pressable>
                <Pressable onPress={handleFinish} style={[styles.mainButton, { backgroundColor: STRAVA_ORANGE }]}>
                  <Feather name="flag" size={24} color="#fff" />
                  <Text style={styles.mainButtonText}>Finish</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={tracker.pause}
                style={[styles.mainButton, styles.wide, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <Feather name="pause" size={26} color={theme.text} />
                <Text style={[styles.mainButtonText, { color: theme.text }]}>Pause</Text>
              </Pressable>
            )}
          </View>

          {Platform.OS === "web" ? (
            <Text style={[styles.note, { color: theme.subtext }]}>
              Keep FitPro open with the screen on. iPhone pauses GPS for home-screen web apps when you switch away or
              lock the phone. If that happens, reopen FitPro and tracking carries on.
            </Text>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------- Idle ----------
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header title="Run & Walk" subtitle="GPS tracking for walks and jogs" />

        <View style={[styles.typeToggle, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {(["walk", "run"] as ActivityType[]).map((t) => {
            const active = t === type;
            return (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                style={[styles.typeOption, active && { backgroundColor: STRAVA_ORANGE }]}
              >
                <Text style={[styles.typeText, { color: active ? "#fff" : theme.text }]}>
                  {t === "walk" ? "🚶 Walk" : "🏃 Run"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={handleStart}
          disabled={starting}
          style={[styles.startButton, { backgroundColor: STRAVA_ORANGE, opacity: starting ? 0.6 : 1 }]}
        >
          {starting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="play" size={34} color="#fff" />
              <Text style={styles.startText}>START</Text>
            </>
          )}
        </Pressable>

        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>This week</Text>
          <View style={styles.weekRow}>
            <WeekStat label="km" value={formatKm(weekTotals.distanceM)} />
            <WeekStat label="time" value={formatDuration(weekTotals.seconds)} />
            <WeekStat label="activities" value={String(weekTotals.count)} />
          </View>
        </Card>

        {Platform.OS === "web" ? (
          <Card style={{ flexDirection: "row", gap: spacing.sm }}>
            <Feather name="info" size={16} color={theme.info} style={{ marginTop: 2 }} />
            <Text style={[styles.note, { color: theme.subtext, flex: 1, marginTop: 0 }]}>
              Tip: keep FitPro open and the screen on while tracking. iPhone stops GPS for web apps in the background.
            </Text>
          </Card>
        ) : null}

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Activities</Text>
        {recent.length === 0 ? (
          <Text style={{ color: theme.subtext }}>No walks or runs yet. Hit Start and go!</Text>
        ) : (
          recent.map((a) => {
            const day = localISO(new Date(a.startedAt));
            return (
              <Pressable key={a.id} onPress={() => router.push(`/activity/${a.id}`)}>
                <Card style={styles.activityRow}>
                  <RouteShape segments={a.segments} width={64} height={64} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.activityTitle, { color: theme.text }]}>{activityTitle(a)}</Text>
                    <Text style={{ color: theme.subtext, fontSize: 12, marginBottom: 4 }}>{shortDate(day)}</Text>
                    <Text style={{ color: theme.text, fontSize: 13 }}>
                      {formatKm(a.distanceM)} km · {formatDuration(a.movingSeconds)} ·{" "}
                      {formatPace(a.movingSeconds, a.distanceM)} /km
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={theme.subtext} />
                </Card>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { theme } = useAppTheme();
  return (
    <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.subtext }]}>{label}</Text>
    </View>
  );
}

function WeekStat({ label, value }: { label: string; value: string }) {
  const { theme } = useAppTheme();
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text style={{ color: theme.text, fontSize: 22, fontWeight: "800" }}>{value}</Text>
      <Text style={{ color: theme.subtext, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  typeToggle: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: spacing.lg,
  },
  typeOption: { flex: 1, paddingVertical: 10, borderRadius: radius.pill, alignItems: "center" },
  typeText: { fontSize: 15, fontWeight: "700" },
  startButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    shadowColor: STRAVA_ORANGE,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  startText: { color: "#fff", fontSize: 18, fontWeight: "900", letterSpacing: 2, marginTop: 4 },
  cardTitle: { fontSize: 15, fontWeight: "700", marginBottom: spacing.sm },
  weekRow: { flexDirection: "row" },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: spacing.sm, marginTop: spacing.xs },
  activityRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.sm },
  activityTitle: { fontSize: 15, fontWeight: "700" },
  liveHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  liveTitle: { fontSize: 22, fontWeight: "800" },
  gpsChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  gpsDot: { width: 8, height: 8, borderRadius: 4 },
  gpsText: { fontSize: 12, fontWeight: "700" },
  error: { fontSize: 13, marginBottom: spacing.sm },
  bigStat: { alignItems: "center", marginTop: spacing.md, marginBottom: spacing.sm },
  bigValue: { fontSize: 56, fontWeight: "900", fontVariant: ["tabular-nums"] },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  statBox: {
    flexBasis: "47%",
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 4,
    alignItems: "center",
  },
  statValue: { fontSize: 26, fontWeight: "800", fontVariant: ["tabular-nums"] },
  statLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginTop: 2 },
  splitRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.md },
  mainButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 18,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "transparent",
  },
  wide: { maxWidth: 320 },
  mainButtonText: { color: "#fff", fontSize: 17, fontWeight: "800" },
  sideButton: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  note: { fontSize: 12, lineHeight: 17, marginTop: spacing.md },
});
