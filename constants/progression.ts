// constants/progression.ts
// Turns the plan's progression rules into concrete targets for today,
// based on what was logged last time:
//
// - Double progression (dumbbells): same weight until every set hits the top
//   of the rep range, then level up. Because the dumbbells max out at 20lb,
//   leveling up at 20lb means: slow tempo -> extra set -> shorter rest.
// - AMRAP / rep-range bodyweight: beat last session's reps by 1.
// - Timed holds: add the weekly increase every program week.

import { ExerciseDef, ExerciseLog } from "./types";
import { MAX_DUMBBELL_LB, WEIGHT_STEP_LB } from "./plan";

export interface LastPerformance {
  date: string;
  log: ExerciseLog;
}

export interface ExerciseTargetPlan {
  setCount: number;
  /** Target reps per set (undefined = go to failure / no target yet). */
  reps?: number[];
  seconds?: number;
  weightLb?: number;
  tempo: boolean;
  restSeconds: number;
  /** One-line instruction for today, e.g. "Beat last time: 10/9/8 -> 11/10/9". */
  headline: string;
  /** True when today's target is a level-up (heavier / tempo / extra set). */
  levelUp: boolean;
}

function doneSets(log?: ExerciseLog) {
  return log ? log.sets.filter((s) => s.done) : [];
}

function fmtRange(min: number, max: number): string {
  return min === max ? `${min}` : `${min}-${max}`;
}

function fmtReps(reps: number[]): string {
  return reps.join("/");
}

/** "3-4 × 8-12 @ 20lb", "3 × AMRAP", "3 × 45 sec" - the plan's written prescription. */
export function prescription(def: ExerciseDef, week: number): string {
  const [minSets, maxSets] = def.sets;
  const sets = minSets === maxSets ? `${minSets}` : `${minSets}-${maxSets}`;
  const side = def.perSide ? "/side" : "";
  const weight = def.weightNote ?? (def.weightLb ? `${def.weightLb}lb` : "");
  const at = weight ? ` @ ${weight}` : "";

  switch (def.target.kind) {
    case "amrap":
      return `${sets} × AMRAP${side}`;
    case "seconds": {
      const secs = def.target.start + (week - 1) * def.target.weeklyIncrease;
      return `${sets} × ${secs} sec${side}`;
    }
    case "reps": {
      const { min, max } = def.target;
      return `${sets} × ${fmtRange(min, max)}${side}${at}`;
    }
  }
}

export function planTarget(def: ExerciseDef, week: number, last?: LastPerformance): ExerciseTargetPlan {
  const lastSets = doneSets(last?.log);
  const lastReps = lastSets.map((s) => s.reps ?? 0);
  const baseSetCount = def.sets[0];

  // ---- Timed holds: add seconds every week ----
  if (def.target.kind === "seconds") {
    const { start, weeklyIncrease } = def.target;
    const seconds = start + (week - 1) * weeklyIncrease;
    return {
      setCount: Math.max(baseSetCount, lastSets.length ? Math.min(lastSets.length, def.sets[1]) : 0),
      seconds,
      tempo: false,
      restSeconds: def.restSeconds,
      headline:
        week > 1
          ? `Week ${week}: hold ${seconds}s${def.perSide ? " per side" : ""} (+${weeklyIncrease}s/week)`
          : `Hold ${seconds}s${def.perSide ? " per side" : ""}. Adds ${weeklyIncrease}s every week.`,
      levelUp: false,
    };
  }

  // ---- Bodyweight: beat last session's reps ----
  if (def.progression === "amrap" || def.progression === "beatReps") {
    const setCount = Math.max(baseSetCount, Math.min(lastSets.length, def.sets[1]));
    if (lastReps.length === 0) {
      const base =
        def.target.kind === "amrap" ? def.target.baseline : def.target.kind === "reps" ? def.target.min : undefined;
      return {
        setCount,
        reps: base ? Array(setCount).fill(base) : undefined,
        tempo: false,
        restSeconds: def.restSeconds,
        headline: base
          ? `Starting point: ${base} reps. Stop when form breaks, not when it gets hard.`
          : "Go until form breaks - this sets your baseline.",
        levelUp: false,
      };
    }
    const reps = Array.from({ length: setCount }, (_, i) => (lastReps[i] ?? lastReps[lastReps.length - 1]) + 1);
    const best = Math.max(...lastReps);
    const topOfRange = def.target.kind === "reps" && lastReps.every((r) => r >= (def.target as { max: number }).max);
    let headline = `Beat last time: ${fmtReps(lastReps)} → ${fmtReps(reps)}`;
    if (def.progression === "amrap" && best >= 20) {
      headline = `${best} reps! Time for a narrower grip or a loaded backpack.`;
    } else if (topOfRange) {
      headline = `Top of the range hit - slow the tempo or add a set.`;
    }
    return { setCount, reps, tempo: false, restSeconds: def.restSeconds, headline, levelUp: best >= 20 || topOfRange };
  }

  // ---- Dumbbell double progression ----
  const { min, max } = def.target as { min: number; max: number };
  const lastWeight = lastSets.reduce<number | undefined>(
    (w, s) => (s.weightLb !== undefined ? Math.max(w ?? 0, s.weightLb) : w),
    undefined
  );
  let weightLb = lastWeight ?? def.weightLb ?? MAX_DUMBBELL_LB;
  let tempo = def.progression === "tempo" || !!last?.log.tempo;
  let setCount = Math.max(baseSetCount, Math.min(lastSets.length, 4));
  let restSeconds = def.restSeconds;

  if (lastReps.length === 0) {
    return {
      setCount,
      reps: Array(setCount).fill(min),
      weightLb,
      tempo,
      restSeconds,
      headline: tempo
        ? `Slow tempo: 3-4s down, normal speed up. Aim for ${fmtRange(min, max)} reps.`
        : `Start at ${weightLb}lb, aim for ${fmtRange(min, max)} reps each set.`,
      levelUp: false,
    };
  }

  const allMaxed = lastReps.length >= baseSetCount && lastReps.every((r) => r >= max);

  if (allMaxed) {
    let headline: string;
    if (weightLb < MAX_DUMBBELL_LB) {
      const next = Math.min(MAX_DUMBBELL_LB, weightLb + WEIGHT_STEP_LB);
      headline = `Range maxed! Go up to ${next}lb. Reps drop back to ~${min} - that's normal.`;
      weightLb = next;
    } else if (!tempo) {
      tempo = true;
      headline = `Maxed at ${MAX_DUMBBELL_LB}lb → switch to slow tempo (3-4s down). Reps drop back to ~${min}.`;
    } else if (setCount < 4) {
      setCount += 1;
      headline = `Maxed with slow tempo → add a ${setCount}th set.`;
    } else {
      restSeconds = 60;
      headline = `Maxed with tempo and 4 sets → cut rest from 90s to 60s.`;
    }
    return { setCount, reps: Array(setCount).fill(min), weightLb, tempo, restSeconds, headline, levelUp: true };
  }

  const reps = Array.from({ length: setCount }, (_, i) => Math.min(max, (lastReps[i] ?? min - 1) + 1));
  return {
    setCount,
    reps,
    weightLb,
    tempo,
    restSeconds,
    headline: `Same ${weightLb}lb, beat last time: ${fmtReps(lastReps)} → ${fmtReps(reps)}`,
    levelUp: false,
  };
}

/** "20lb · 10/9/8" or "45s/45s/40s" summary of a logged exercise. */
export function summarizeLog(log: ExerciseLog): string {
  const sets = doneSets(log);
  if (sets.length === 0) return "not done";
  if (sets.some((s) => s.seconds !== undefined)) return sets.map((s) => `${s.seconds ?? 0}s`).join("/");
  const reps = fmtReps(sets.map((s) => s.reps ?? 0));
  const weight = sets.find((s) => s.weightLb !== undefined)?.weightLb;
  return `${weight !== undefined ? `${weight}lb · ` : ""}${reps}${log.tempo ? " (tempo)" : ""}`;
}
