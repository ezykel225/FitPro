// components/SwapSheet.tsx
// Bottom sheet listing the planned exercise and its alternatives for a slot.
// Picking one swaps it in for this and future weeks; each exercise keeps its
// own progression history.

import React from "react";
import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAppTheme } from "../context/ThemeContext";
import { spacing, radius } from "../constants/theme";
import { prescription } from "../constants/progression";
import { SlotView } from "../hooks/useWorkout";
import { ExerciseDef } from "../constants/types";

interface SwapSheetProps {
  view: SlotView | null;
  week: number;
  onPick: (slotId: string, exerciseId: string | null) => void;
  onClose: () => void;
}

export default function SwapSheet({ view, week, onPick, onClose }: SwapSheetProps) {
  const { theme } = useAppTheme();
  if (!view) return null;

  const options: { def: ExerciseDef; planned: boolean }[] = [
    { def: view.slot.main, planned: true },
    ...view.slot.alternatives.map((def) => ({ def, planned: false })),
  ];

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.grabber, { backgroundColor: theme.border }]} />
        <Text style={[styles.title, { color: theme.text }]}>Can't do it? Swap it.</Text>
        <Text style={[styles.subtitle, { color: theme.subtext }]}>
          Same muscles, same equipment. Your pick sticks for future weeks and tracks its own progress.
        </Text>
        <ScrollView style={{ maxHeight: 460 }}>
          {options.map(({ def, planned }) => {
            const selected = def.id === view.exercise.id;
            return (
              <Pressable
                key={def.id}
                onPress={() => {
                  onPick(view.slot.id, planned ? null : def.id);
                  onClose();
                }}
                style={[
                  styles.option,
                  {
                    borderColor: selected ? theme.primary : theme.border,
                    backgroundColor: selected ? theme.primary + "1A" : theme.background,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.optionTitleRow}>
                    <Text style={[styles.optionName, { color: theme.text }]}>{def.name}</Text>
                    {planned ? (
                      <View style={[styles.badge, { backgroundColor: theme.primary + "33" }]}>
                        <Text style={[styles.badgeText, { color: theme.primary }]}>PLAN</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.optionMeta, { color: theme.subtext }]}>{prescription(def, week)}</Text>
                  {def.tip ? <Text style={[styles.optionTip, { color: theme.subtext }]}>{def.tip}</Text> : null}
                </View>
                {selected ? <Feather name="check-circle" size={20} color={theme.primary} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable onPress={onClose} style={[styles.cancel, { borderColor: theme.border }]}>
          <Text style={{ color: theme.text, fontWeight: "600" }}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  grabber: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: spacing.sm },
  title: { fontSize: 18, fontWeight: "800" },
  subtitle: { fontSize: 13, marginTop: 4, marginBottom: spacing.md, lineHeight: 18 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    marginBottom: spacing.sm,
  },
  optionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  optionName: { fontSize: 15, fontWeight: "700", flexShrink: 1 },
  optionMeta: { fontSize: 12, marginTop: 2 },
  optionTip: { fontSize: 12, marginTop: 4, lineHeight: 17 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.pill },
  badgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  cancel: { borderWidth: 1, borderRadius: radius.md, paddingVertical: 12, alignItems: "center", marginTop: spacing.xs },
});
