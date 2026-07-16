// components/WorkoutCard.tsx
// Renders a single exercise inside the selected workout day: name,
// sets/reps, a completion checkbox, and a button to start its rest timer.

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAppTheme } from "../context/ThemeContext";
import { spacing, radius } from "../constants/theme";
import { Exercise } from "../constants/types";

interface WorkoutCardProps {
  exercise: Exercise;
  onToggle: (id: string) => void;
  onStartRest: (seconds: number) => void;
}

export default function WorkoutCard({ exercise, onToggle, onStartRest }: WorkoutCardProps) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.row, { borderColor: theme.border }]}>
      <Pressable
        onPress={() => onToggle(exercise.id)}
        style={[
          styles.checkbox,
          {
            borderColor: theme.primary,
            backgroundColor: exercise.completed ? theme.primary : "transparent",
          },
        ]}
      >
        {exercise.completed ? <Feather name="check" size={16} color="#fff" /> : null}
      </Pressable>

      <View style={styles.info}>
        <Text
          style={[
            styles.name,
            { color: theme.text },
            exercise.completed && styles.strikethrough,
          ]}
        >
          {exercise.name}
        </Text>
        <Text style={[styles.meta, { color: theme.subtext }]}>
          {exercise.sets} sets × {exercise.reps}
        </Text>
      </View>

      <Pressable
        onPress={() => onStartRest(exercise.restSeconds)}
        style={[styles.restButton, { backgroundColor: theme.background }]}
      >
        <Text style={[styles.restButtonText, { color: theme.primary }]}>
          Rest {exercise.restSeconds}s
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  checkmark: {
    color: "#fff",
    fontWeight: "700",
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
  },
  strikethrough: {
    textDecorationLine: "line-through",
    opacity: 0.5,
  },
  meta: {
    fontSize: 12,
    marginTop: 2,
  },
  restButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  restButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
