// constants/plan.ts
// The PPL (Push / Pull / Legs) program: Monday-Friday, dumbbells (10-20lb
// adjustable) + bench + push-up board + bodyweight.
//
// Every slot has the planned exercise plus alternatives that use the same
// equipment, so an exercise you can't do can be swapped from the Workout screen.

import { ExerciseDef, ExerciseSlot, WorkoutDay } from "./types";

/** Heaviest the adjustable dumbbells go. Past this, lifts progress with tempo/sets/rest instead. */
export const MAX_DUMBBELL_LB = 20;
/** Weight jump suggested when a lift maxes out its rep range below MAX_DUMBBELL_LB. */
export const WEIGHT_STEP_LB = 2.5;

// ---- Small builders so the plan below reads like the PDF tables ----

type Extra = Partial<Pick<ExerciseDef, "perSide" | "tip" | "weightNote" | "restSeconds">>;

/** Dumbbell lift with double progression. */
function db(
  id: string,
  name: string,
  sets: [number, number],
  min: number,
  max: number,
  weightLb: number,
  extra: Extra = {}
): ExerciseDef {
  return {
    id,
    name,
    sets,
    target: { kind: "reps", min, max },
    progression: "double",
    weightLb,
    restSeconds: 90,
    ...extra,
  };
}

/** Bodyweight, as many reps as possible. */
function amrap(id: string, name: string, sets: [number, number], extra: Extra & { baseline?: number } = {}): ExerciseDef {
  const { baseline, ...rest } = extra;
  return {
    id,
    name,
    sets,
    target: { kind: "amrap", baseline },
    progression: "amrap",
    restSeconds: 60,
    ...rest,
  };
}

/** Bodyweight with a rep range - beat last session's reps. */
function bw(id: string, name: string, sets: [number, number], min: number, max: number, extra: Extra = {}): ExerciseDef {
  return {
    id,
    name,
    sets,
    target: { kind: "reps", min, max },
    progression: "beatReps",
    restSeconds: 60,
    ...extra,
  };
}

/** Timed hold - add seconds every week. */
function hold(
  id: string,
  name: string,
  sets: [number, number],
  startSeconds: number,
  weeklyIncrease: number,
  extra: Extra = {}
): ExerciseDef {
  return {
    id,
    name,
    sets,
    target: { kind: "seconds", start: startSeconds, weeklyIncrease },
    progression: "timed",
    restSeconds: 45,
    ...extra,
  };
}

function slot(id: string, main: ExerciseDef, alternatives: ExerciseDef[]): ExerciseSlot {
  return { id, main, alternatives };
}

// ---- Shared alternative pools (same muscles, same equipment) ----

const lateralRaiseAlts = (sets: [number, number], min: number, max: number) => [
  db("seated-lateral-raise", "Seated DB Lateral Raise (on bench)", sets, min, max, 10, {
    tip: "Sitting removes body swing - strict delts.",
  }),
  db("leaning-lateral-raise", "Leaning Single-Arm Lateral Raise", sets, min, max, 10, {
    perSide: true,
    tip: "Hold a doorframe and lean away for a bigger stretch.",
  }),
  db("db-upright-row", "DB Upright Row (wide grip)", sets, min, max, 15, {
    tip: "Pull elbows up and out, stop at chest height.",
  }),
];

const bentOverRowAlts = (sets: [number, number], min: number, max: number) => [
  db("chest-supported-row", "Chest-Supported DB Row (incline bench)", sets, min, max, 20, {
    tip: "Lie face-down on the propped-up bench - easy on the lower back.",
  }),
  db("single-arm-row-alt", "Single-Arm DB Row (knee/hand on bench)", sets, min, max, 20, { perSide: true }),
  db("db-pullover", "DB Pullover (across bench)", sets, min, max, 20, {
    tip: "One dumbbell held in both hands, lower behind the head with soft elbows.",
  }),
];

const hammerCurlAlts = (sets: [number, number], min: number, max: number) => [
  db("cross-body-hammer", "Cross-Body Hammer Curl", sets, min, max, 20),
  db("zottman-curl", "Zottman Curl", sets, min, max, 15, {
    tip: "Curl palms-up, rotate at the top, lower palms-down slowly.",
  }),
  db("concentration-curl-h", "Concentration Curl", sets, min, max, 15, { perSide: true }),
];

// ---- The plan ----

export const WORKOUT_PLAN: WorkoutDay[] = [
  {
    key: "push1",
    weekday: 1,
    shortLabel: "Mon",
    label: "Push",
    focus: "Chest, Shoulders, Triceps",
    emoji: "💪",
    slots: [
      slot(
        "p1-bench",
        {
          id: "db-bench-press",
          name: "DB Bench Press (on bench)",
          sets: [3, 4],
          target: { kind: "reps", min: 8, max: 12 },
          progression: "tempo",
          weightLb: 20,
          restSeconds: 90,
          tip: "Slow tempo: 3-4 sec on the way down, normal speed up. You're past 12 reps at normal speed.",
        },
        [
          db("db-floor-press", "DB Floor Press", [3, 4], 8, 12, 20, {
            tip: "Lie on the floor - elbows stop at the ground. Good if the bench hurts your shoulders.",
          }),
          db("db-squeeze-press", "DB Squeeze Press (on bench)", [3, 4], 8, 12, 20, {
            tip: "Press the dumbbells together the whole rep - hits inner chest.",
          }),
          amrap("weighted-pushup", "Push-ups with Backpack (push-up board)", [3, 4], {
            tip: "Load a backpack with books for extra resistance.",
          }),
        ]
      ),
      slot("p1-incline", db("db-incline-press", "DB Incline Press (bench propped up)", [3, 3], 8, 12, 20), [
        amrap("decline-pushup-alt", "Decline Push-ups (feet on bench)", [3, 3], {
          tip: "Feet up shifts work to the upper chest - same target as incline press.",
        }),
        db("db-incline-fly", "DB Incline Fly", [3, 3], 10, 15, 10, { tip: "Slight bend in the elbows, big stretch at the bottom." }),
        db("db-low-high-fly", "DB Low-to-High Fly (standing)", [3, 3], 12, 15, 10),
      ]),
      slot(
        "p1-pushup",
        amrap("pushup-wide", "Push-ups (push-up board, wide grip)", [3, 3], {
          baseline: 12,
          tip: "Beat last session's reps. At 20+ clean reps, move to a narrower grip or add a backpack.",
        }),
        [
          amrap("pushup-floor", "Push-ups (floor)", [3, 3]),
          amrap("pushup-incline", "Incline Push-ups (hands on bench)", [3, 3], { tip: "Easier version - build up to the board." }),
          amrap("pushup-knee", "Knee Push-ups (push-up board)", [3, 3]),
        ]
      ),
      slot("p1-shoulder", db("db-shoulder-press", "DB Shoulder Press", [3, 4], 8, 12, 20), [
        db("seated-db-shoulder-press", "Seated DB Shoulder Press (on bench)", [3, 4], 8, 12, 20, {
          tip: "Back supported - less lower-back strain.",
        }),
        db("db-arnold-press-alt", "DB Arnold Press", [3, 4], 8, 12, 20),
        amrap("pike-pushup", "Pike Push-ups", [3, 4], { tip: "Hips high, lower your head between your hands." }),
      ]),
      slot(
        "p1-lateral",
        db("db-lateral-raise", "DB Lateral Raise", [3, 3], 12, 15, 10, { restSeconds: 60 }),
        lateralRaiseAlts([3, 3], 12, 15)
      ),
      slot(
        "p1-diamond",
        amrap("diamond-pushup", "Diamond Push-ups (push-up board, narrow grip)", [2, 3]),
        [
          amrap("bench-dips", "Bench Dips", [2, 3], { tip: "Hands on the bench edge behind you, elbows straight back." }),
          db("db-skull-crusher", "DB Skull Crusher (on bench)", [2, 3], 10, 15, 15),
          amrap("diamond-knee", "Knee Diamond Push-ups", [2, 3]),
        ]
      ),
    ],
  },
  {
    key: "pull1",
    weekday: 2,
    shortLabel: "Tue",
    label: "Pull",
    focus: "Back, Biceps, Core",
    emoji: "🏋️",
    slots: [
      slot("u1-row", db("db-bent-over-row", "DB Bent-Over Row", [4, 4], 10, 12, 20), bentOverRowAlts([4, 4], 10, 12)),
      slot(
        "u1-single-row",
        db("single-arm-row", "Single-Arm DB Row (knee/hand on bench)", [4, 4], 12, 12, 20, { perSide: true }),
        [
          db("chest-supported-row-2", "Chest-Supported DB Row (incline bench)", [4, 4], 10, 12, 20),
          db("renegade-row-alt", "Renegade Rows", [4, 4], 8, 10, 10, { perSide: true }),
          db("db-rear-delt-row", "DB Rear-Delt Row (elbows wide)", [4, 4], 12, 15, 15),
        ]
      ),
      slot("u1-curl", db("db-bicep-curl", "DB Bicep Curl", [3, 3], 12, 15, 20), [
        db("incline-db-curl", "Incline DB Curl (on bench)", [3, 3], 10, 15, 15, { tip: "Arms hang behind you - big bicep stretch." }),
        db("concentration-curl", "Concentration Curl", [3, 3], 10, 15, 15, { perSide: true }),
        db("zottman-curl-2", "Zottman Curl", [3, 3], 10, 15, 15),
      ]),
      slot("u1-hammer", db("db-hammer-curl", "DB Hammer Curl", [3, 3], 12, 15, 20), hammerCurlAlts([3, 3], 12, 15)),
      slot("u1-superman", hold("superman-hold", "Superman Hold", [3, 3], 25, 5), [
        hold("bird-dog-hold", "Bird Dog Hold", [3, 3], 25, 5, { perSide: true }),
        hold("glute-bridge-hold", "Glute Bridge Hold", [3, 3], 30, 5),
        bw("prone-yt-raise", "Prone Y-T Raise", [3, 3], 10, 15),
      ]),
      slot("u1-plank", hold("plank", "Plank", [3, 3], 45, 10), [
        hold("knee-plank", "Knee Plank", [3, 3], 45, 10),
        hold("hollow-hold", "Hollow Body Hold", [3, 3], 20, 5),
        hold("dead-bug", "Dead Bug (slow, timed)", [3, 3], 40, 10),
      ]),
      slot("u1-leg-raise", bw("lying-leg-raise", "Lying Leg Raise", [3, 3], 15, 20), [
        bw("bent-knee-leg-raise", "Bent-Knee Leg Raise", [3, 3], 15, 20),
        bw("reverse-crunch", "Reverse Crunch", [3, 3], 15, 20),
        bw("flutter-kicks", "Flutter Kicks (per side)", [3, 3], 15, 20),
      ]),
    ],
  },
  {
    key: "legs",
    weekday: 3,
    shortLabel: "Wed",
    label: "Legs",
    focus: "Quads, Hamstrings, Glutes, Calves",
    emoji: "🦵",
    slots: [
      slot("l-goblet", db("db-goblet-squat", "DB Goblet Squat", [4, 4], 8, 12, 20), [
        db("db-box-squat", "DB Box Squat (sit to bench)", [4, 4], 8, 12, 20, { tip: "Tap the bench, stand up - controls depth." }),
        db("heels-elevated-goblet", "Heels-Elevated Goblet Squat", [4, 4], 8, 12, 20, {
          tip: "Heels on a book or plate - more quads, easier on stiff ankles.",
        }),
        hold("wall-sit", "Wall Sit (holding DB)", [4, 4], 30, 10),
      ]),
      slot("l-rdl", db("db-rdl", "DB Romanian Deadlift", [4, 4], 8, 12, 20), [
        db("single-leg-rdl", "Single-Leg DB RDL", [4, 4], 8, 12, 15, { perSide: true }),
        db("db-hip-thrust", "DB Hip Thrust (back on bench)", [4, 4], 10, 15, 20),
        db("db-good-morning", "DB Good Morning", [4, 4], 10, 12, 15),
      ]),
      slot(
        "l-bulgarian",
        db("bulgarian-split-squat", "Bulgarian Split Squat (rear foot on bench)", [3, 3], 10, 12, 20, { perSide: true }),
        [
          db("db-reverse-lunge", "DB Reverse Lunge", [3, 3], 10, 12, 20, {
            perSide: true,
            tip: "Step back instead of forward - easier on the knees and balance.",
          }),
          db("db-split-squat", "DB Split Squat (both feet on floor)", [3, 3], 10, 12, 20, {
            perSide: true,
            tip: "Same movement without the rear foot up - much easier to balance.",
          }),
          db("db-step-up", "DB Step-ups (onto bench)", [3, 3], 10, 12, 20, {
            perSide: true,
            tip: "Drive through the front heel, don't push off the back foot.",
          }),
        ]
      ),
      slot(
        "l-lunge",
        db("walking-lunge", "Walking Lunges", [3, 3], 12, 12, 20, { perSide: true, weightNote: "15-20lb" }),
        [
          db("reverse-lunge-2", "DB Reverse Lunge", [3, 3], 12, 12, 20, { perSide: true, tip: "No space to walk? Lunge in place backwards." }),
          db("static-split-squat-2", "DB Static Split Squat", [3, 3], 12, 12, 20, { perSide: true }),
          db("lateral-lunge", "DB Lateral Lunge", [3, 3], 10, 12, 15, { perSide: true }),
        ]
      ),
      slot("l-jump", bw("jump-squat", "Jump Squats", [2, 3], 12, 15), [
        bw("bodyweight-squat-tempo", "Tempo Bodyweight Squat (3s down)", [2, 3], 15, 20, { tip: "No jumping - good for knees or thin floors." }),
        bw("squat-pulse", "Squat Pulses", [2, 3], 15, 20),
        bw("glute-bridge", "Glute Bridge", [2, 3], 15, 20),
      ]),
      slot("l-calf", db("standing-calf-raise", "Standing Calf Raise", [4, 4], 15, 20, 20, { restSeconds: 60 }), [
        db("single-leg-calf-raise", "Single-Leg Calf Raise (on step)", [4, 4], 12, 15, 20, { perSide: true }),
        db("seated-calf-raise", "Seated DB Calf Raise (DB on knees)", [4, 4], 15, 20, 20),
      ]),
    ],
  },
  {
    key: "push2",
    weekday: 4,
    shortLabel: "Thu",
    label: "Push 2",
    focus: "Shoulders & Arms",
    emoji: "🔥",
    slots: [
      slot("p2-arnold", db("db-arnold-press", "DB Arnold Press", [3, 4], 8, 12, 20), [
        db("db-shoulder-press-2", "DB Shoulder Press", [3, 4], 8, 12, 20),
        db("seated-arnold-press", "Seated Arnold Press (on bench)", [3, 4], 8, 12, 20),
        amrap("pike-pushup-2", "Pike Push-ups", [3, 4]),
      ]),
      slot("p2-decline", amrap("decline-pushup", "Decline Push-ups (feet on bench)", [3, 3]), [
        amrap("pushup-floor-2", "Push-ups (floor)", [3, 3]),
        amrap("pushup-board-2", "Push-ups (push-up board, wide grip)", [3, 3]),
        amrap("pike-pushup-3", "Pike Push-ups", [3, 3]),
      ]),
      slot(
        "p2-lateral",
        db("db-lateral-raise-2", "DB Lateral Raise", [3, 3], 12, 15, 10, { restSeconds: 60 }),
        lateralRaiseAlts([3, 3], 12, 15)
      ),
      slot(
        "p2-overhead-ext",
        db("db-overhead-triceps", "DB Overhead Triceps Extension", [3, 3], 10, 15, 15, { weightNote: "10-20lb" }),
        [
          db("db-skull-crusher-2", "DB Skull Crusher (on bench)", [3, 3], 10, 15, 15),
          db("db-kickback", "DB Triceps Kickback", [3, 3], 12, 15, 10, { perSide: true }),
          amrap("bench-dips-2", "Bench Dips", [3, 3]),
        ]
      ),
      slot("p2-close-grip", amrap("close-grip-pushup", "Close-Grip Push-ups (push-up board, narrow grip)", [2, 3]), [
        amrap("bench-dips-3", "Bench Dips", [2, 3]),
        amrap("diamond-knee-2", "Knee Diamond Push-ups", [2, 3]),
        db("db-kickback-2", "DB Triceps Kickback", [2, 3], 12, 15, 10, { perSide: true }),
      ]),
    ],
  },
  {
    key: "pull2",
    weekday: 5,
    shortLabel: "Fri",
    label: "Pull 2",
    focus: "Back & Core",
    emoji: "⚡",
    slots: [
      slot("u2-row", db("db-bent-over-row-2", "DB Bent-Over Row", [4, 4], 8, 12, 20), bentOverRowAlts([4, 4], 8, 12)),
      slot("u2-hammer", db("db-hammer-curl-2", "DB Hammer Curl", [3, 3], 10, 15, 20), hammerCurlAlts([3, 3], 10, 15)),
      slot("u2-renegade", db("renegade-row", "Renegade Rows", [3, 3], 8, 10, 10, { perSide: true }), [
        db("single-arm-row-3", "Single-Arm DB Row (knee/hand on bench)", [3, 3], 10, 12, 20, { perSide: true }),
        db("renegade-row-knees", "Renegade Rows (on knees)", [3, 3], 8, 10, 10, { perSide: true, tip: "Knees down makes the plank part easier." }),
        db("chest-supported-row-3", "Chest-Supported DB Row (incline bench)", [3, 3], 10, 12, 20),
      ]),
      slot("u2-climbers", hold("mountain-climbers", "Mountain Climbers", [3, 3], 30, 10), [
        hold("slow-mountain-climbers", "Slow Mountain Climbers", [3, 3], 30, 10),
        hold("plank-shoulder-taps", "Plank Shoulder Taps", [3, 3], 30, 10),
        hold("dead-bug-2", "Dead Bug (timed)", [3, 3], 30, 10),
      ]),
      slot("u2-side-plank", hold("side-plank", "Side Plank", [2, 2], 30, 10, { perSide: true }), [
        hold("knee-side-plank", "Knee Side Plank", [2, 2], 30, 10, { perSide: true }),
        hold("plank-2", "Plank", [2, 2], 45, 10),
      ]),
    ],
  },
];

export function getPlanDay(key: string): WorkoutDay | undefined {
  return WORKOUT_PLAN.find((d) => d.key === key);
}

/** Finds the exercise currently used in a slot (the planned one unless swapped). */
export function resolveExercise(slotDef: ExerciseSlot, swappedId?: string): ExerciseDef {
  if (!swappedId) return slotDef.main;
  return slotDef.alternatives.find((a) => a.id === swappedId) ?? slotDef.main;
}
