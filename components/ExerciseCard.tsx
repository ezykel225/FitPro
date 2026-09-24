// components/ExerciseCard.tsx
// One exercise in today's workout: the plan's prescription, today's
// progression target, what you did last time, and a row per set where you
// enter weight / reps (or seconds) and tick it off. The swap button opens
// the alternatives picker.

import React, { useState } from "react";
import { View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAppTheme } from "../context/ThemeContext";
import { spacing, radius } from "../constants/theme";
import { prescription, summarizeLog } from "../constants/progression";
import { SlotView } from "../hooks/useWorkout";
import { SetLog } from "../constants/types";
import { shortDate } from "../services/dates";

interface ExerciseCardProps {
  view: SlotView;
  week: number;
  onUpdateSet: (slotId: string, index: number, patch: Partial<SetLog>) => void;
  onToggleSet: (slotId: string, index: number) => void;
  onAddSet: (slotId: string) => void;
  onRemoveSet: (slotId: string) => void;
  onToggleTempo: (slotId: string) => void;
  onStartRest: (seconds: number) => void;
  onSwap: (view: SlotView) => void;
}

function parseNum(text: string): number | undefined {
  const n = parseFloat(text.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

export default function ExerciseCard({
  view,
  week,
  onUpdateSet,
  onToggleSet,
  onAddSet,
  onRemoveSet,
  onToggleTempo,
  onStartRest,
  onSwap,
}: ExerciseCardProps) {
  const { theme } = useAppTheme();
  const { slot, exercise, target, last, log, isSwapped } = view;
  const doneCount = log.sets.filter((s) => s.done).length;
  const allDone = doneCount === log.sets.length;
  const [expanded, setExpanded] = useState(!allDone);

  const timed = exercise.target.kind === "seconds";
  const hasWeight = exercise.weightLb !== undefined;
  const canTempo = exercise.progression === "double" || exercise.progression === "tempo";

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }];

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: allDone ? theme.success : theme.border }]}>
      <Pressable onPress={() => setExpanded((e) => !e)} style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: theme.text }]}>{exercise.name}</Text>
          <View style={styles.metaRow}>
            <Text style={[styles.meta, { color: theme.subtext }]}>{prescription(exercise, week)}</Text>
            {log.tempo ? (
              <View style={[styles.badge, { backgroundColor: theme.warning + "33" }]}>
                <Text style={[styles.badgeText, { color: theme.warning }]}>SLOW TEMPO</Text>
              </View>
            ) : null}
            {isSwapped ? (
              <View style={[styles.badge, { backgroundColor: theme.info + "33" }]}>
                <Text style={[styles.badgeText, { color: theme.info }]}>SWAPPED</Text>
              </View>
            ) : null}
          </View>
        </View>
        <Text style={[styles.count, { color: allDone ? theme.success : theme.subtext }]}>
          {doneCount}/{log.sets.length}
        </Text>
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={18} color={theme.subtext} />
      </Pressable>

      {expanded ? (
        <>
          <View style={[styles.targetBox, { backgroundColor: (target.levelUp ? theme.success : theme.primary) + "1F" }]}>
            <Feather
              name={target.levelUp ? "trending-up" : "target"}
              size={14}
              color={target.levelUp ? theme.success : theme.primary}
            />
            <Text style={[styles.targetText, { color: theme.text }]}>{target.headline}</Text>
          </View>

          {last ? (
            <Text style={[styles.last, { color: theme.subtext }]}>
              Last time ({shortDate(last.date)}): {summarizeLog(last.log)}
            </Text>
          ) : null}
          {exercise.tip ? <Text style={[styles.tip, { color: theme.subtext }]}>💡 {exercise.tip}</Text> : null}

          <View style={styles.setHeader}>
            <Text style={[styles.colSet, styles.colHead, { color: theme.subtext }]}>SET</Text>
            {hasWeight ? <Text style={[styles.colInput, styles.colHead, { color: theme.subtext }]}>LB</Text> : null}
            <Text style={[styles.colInput, styles.colHead, { color: theme.subtext }]}>
              {timed ? "SEC" : exercise.perSide ? "REPS/SIDE" : "REPS"}
            </Text>
            <View style={styles.colCheck} />
          </View>

          {log.sets.map((set, i) => {
            const targetValue = timed ? target.seconds : target.reps?.[i] ?? target.reps?.[target.reps.length - 1];
            const value = timed ? set.seconds : set.reps;
            return (
              <View key={i} style={[styles.setRow, set.done && { opacity: 0.6 }]}>
                <Text style={[styles.colSet, styles.setNum, { color: theme.text }]}>{i + 1}</Text>
                {hasWeight ? (
                  <TextInput
                    style={[inputStyle, styles.colInput]}
                    keyboardType="decimal-pad"
                    value={set.weightLb !== undefined ? String(set.weightLb) : ""}
                    placeholder={target.weightLb !== undefined ? String(target.weightLb) : "lb"}
                    placeholderTextColor={theme.subtext}
                    onChangeText={(t) => onUpdateSet(slot.id, i, { weightLb: parseNum(t) })}
                    selectTextOnFocus
                  />
                ) : null}
                <TextInput
                  style={[inputStyle, styles.colInput]}
                  keyboardType="number-pad"
                  value={value !== undefined ? String(value) : ""}
                  placeholder={targetValue !== undefined ? String(targetValue) : "max"}
                  placeholderTextColor={theme.subtext}
                  onChangeText={(t) =>
                    onUpdateSet(slot.id, i, timed ? { seconds: parseNum(t) } : { reps: parseNum(t) })
                  }
                  selectTextOnFocus
                />
                <Pressable
                  onPress={() => {
                    onToggleSet(slot.id, i);
                    if (!set.done) onStartRest(target.restSeconds);
                  }}
                  style={[
                    styles.colCheck,
                    styles.check,
                    { borderColor: theme.success, backgroundColor: set.done ? theme.success : "transparent" },
                  ]}
                  accessibilityLabel={`Set ${i + 1} done`}
                >
                  {set.done ? <Feather name="check" size={18} color="#fff" /> : null}
                </Pressable>
              </View>
            );
          })}

          <View style={styles.actions}>
            {log.sets.length < Math.max(exercise.sets[1], target.setCount) + 1 ? (
              <ActionChip icon="plus" label="Set" onPress={() => onAddSet(slot.id)} />
            ) : null}
            {log.sets.length > 1 ? <ActionChip icon="minus" label="Set" onPress={() => onRemoveSet(slot.id)} /> : null}
            {canTempo ? (
              <ActionChip
                icon="clock"
                label="Tempo"
                active={!!log.tempo}
                onPress={() => onToggleTempo(slot.id)}
              />
            ) : null}
            <ActionChip icon="watch" label={`Rest ${target.restSeconds}s`} onPress={() => onStartRest(target.restSeconds)} />
            <ActionChip icon="repeat" label="Swap" onPress={() => onSwap(view)} />
          </View>
        </>
      ) : null}
    </View>
  );
}

function ActionChip({
  icon,
  label,
  onPress,
  active,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  const { theme } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: active ? theme.warning + "33" : theme.background, borderColor: active ? theme.warning : theme.border },
      ]}
    >
      <Feather name={icon} size={13} color={active ? theme.warning : theme.primary} />
      <Text style={[styles.chipText, { color: active ? theme.warning : theme.primary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  name: { fontSize: 16, fontWeight: "700" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 3 },
  meta: { fontSize: 12 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.pill },
  badgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  count: { fontSize: 13, fontWeight: "700" },
  targetBox: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  targetText: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  last: { fontSize: 12, marginTop: 6 },
  tip: { fontSize: 12, marginTop: 4, lineHeight: 17 },
  setHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm, marginBottom: 4 },
  colHead: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5, textAlign: "center" },
  colSet: { width: 32, textAlign: "center" },
  // flexBasis/minWidth 0: web text inputs otherwise keep a ~20-character default width
  colInput: { flex: 1, flexBasis: 0, minWidth: 0 },
  colCheck: { width: 44 },
  setRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: 6 },
  setNum: { fontSize: 15, fontWeight: "700" },
  input: {
    height: 42,
    borderWidth: 1,
    borderRadius: radius.sm,
    textAlign: "center",
    fontSize: 16, // 16px+ stops iOS Safari zooming in on focus
    fontWeight: "600",
  },
  check: {
    height: 42,
    borderRadius: radius.sm,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: spacing.xs },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: "600" },
});
