// hooks/useActivityTracker.ts
// GPS walk/run tracking, Strava-style: start / pause / resume / finish,
// live distance, moving time, pace and per-km splits, plus the saved
// activity history.
//
// The in-progress activity is saved to storage on every GPS point, so if the
// phone kills the app (iOS does this to web apps in the background) you can
// reopen FitPro and carry on where you left off.

import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { Activity, ActivityType, LatLng, UserProfile, WeightEntry } from "../constants/types";
import { getItem, setItem, removeItem, STORAGE_KEYS } from "../services/storage";
import { estimateCalories, haversineM } from "../services/geo";

const KEEP_AWAKE_TAG = "fitpro-activity";
/** Ignore fixes less accurate than this (metres). */
const MAX_ACCURACY_M = 35;
/** Ignore movement smaller than this - it's GPS jitter while standing still. */
const MIN_STEP_M = 3;
/** Ignore jumps faster than this (m/s, ~43 km/h) - GPS glitches. */
const MAX_SPEED_MS = 12;
/** Window used for "current pace". */
const CURRENT_PACE_WINDOW_MS = 30000;

export type TrackerStatus = "idle" | "tracking" | "paused";

interface LiveActivity {
  id: string;
  type: ActivityType;
  status: "tracking" | "paused";
  startedAt: number;
  segments: LatLng[][];
  distanceM: number;
  /** Moving time banked before the current tracking stretch. */
  movingMsBefore: number;
  /** When the current tracking stretch began (null while paused). */
  resumedAt: number | null;
  lastFix: { point: LatLng; t: number } | null;
  splits: number[];
  recent: { t: number; d: number }[];
}

export interface GpsStatus {
  accuracy: number | null;
  lastFixAt: number | null;
  error: string | null;
}

function movingMs(live: LiveActivity, now = Date.now()): number {
  return live.movingMsBefore + (live.resumedAt ? now - live.resumedAt : 0);
}

async function bodyWeightKg(): Promise<number> {
  const [log, profile] = await Promise.all([
    getItem<WeightEntry[]>(STORAGE_KEYS.WEIGHT_LOG, []),
    getItem<UserProfile | null>(STORAGE_KEYS.PROFILE, null),
  ]);
  return log[log.length - 1]?.weightKg ?? profile?.startingWeightKg ?? 70;
}

export function useActivityTracker() {
  const [live, setLive] = useState<LiveActivity | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [gps, setGps] = useState<GpsStatus>({ accuracy: null, lastFixAt: null, error: null });
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [weightKg, setWeightKg] = useState(70);

  const liveRef = useRef<LiveActivity | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  const commit = useCallback((next: LiveActivity | null) => {
    liveRef.current = next;
    setLive(next);
    if (next) setItem(STORAGE_KEYS.ACTIVE_ACTIVITY, next);
    else removeItem(STORAGE_KEYS.ACTIVE_ACTIVITY);
  }, []);

  const handleFix = useCallback(
    (loc: Location.LocationObject) => {
      const accuracy = loc.coords.accuracy ?? null;
      setGps({ accuracy, lastFixAt: Date.now(), error: null });

      const current = liveRef.current;
      if (!current || current.status !== "tracking") return;
      if (accuracy !== null && accuracy > MAX_ACCURACY_M) return;

      const point: LatLng = [loc.coords.latitude, loc.coords.longitude];
      const t = loc.timestamp || Date.now();
      const segments = current.segments.map((s) => s.slice());
      const segment = segments[segments.length - 1];

      if (!current.lastFix || segment.length === 0) {
        segment.push(point);
        commit({ ...current, segments, lastFix: { point, t } });
        return;
      }

      const d = haversineM(current.lastFix.point, point);
      const dt = Math.max(1, (t - current.lastFix.t) / 1000);
      if (d < MIN_STEP_M || d / dt > MAX_SPEED_MS) return;

      segment.push(point);
      const distanceM = current.distanceM + d;

      // Record a split each time another full kilometre is completed.
      const splits = current.splits.slice();
      if (Math.floor(distanceM / 1000) > splits.length) {
        const elapsed = movingMs(current, t) / 1000;
        const previous = splits.reduce((a, b) => a + b, 0);
        splits.push(Math.round(elapsed - previous));
      }

      const recent = [...current.recent, { t, d: distanceM }].filter((r) => t - r.t <= CURRENT_PACE_WINDOW_MS);
      commit({ ...current, segments, distanceM, splits, recent, lastFix: { point, t } });
    },
    [commit]
  );

  const startWatching = useCallback(async () => {
    if (watchRef.current) return true;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setGps((g) => ({ ...g, error: "Location permission denied. Allow location for FitPro to track." }));
        return false;
      }
      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 0 },
        handleFix
      );
      return true;
    } catch (e) {
      setGps((g) => ({ ...g, error: "Couldn't start GPS. Check that Location Services are on." }));
      return false;
    }
  }, [handleFix]);

  const stopWatching = useCallback(() => {
    watchRef.current?.remove();
    watchRef.current = null;
  }, []);

  const keepAwake = useCallback((on: boolean) => {
    try {
      if (on) activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
      else deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    } catch {
      // Screen wake lock isn't available everywhere - tracking still works.
    }
  }, []);

  // Load history, and restore an activity that was in progress.
  useEffect(() => {
    (async () => {
      const [saved, active, kg] = await Promise.all([
        getItem<Activity[]>(STORAGE_KEYS.ACTIVITIES, []),
        getItem<LiveActivity | null>(STORAGE_KEYS.ACTIVE_ACTIVITY, null),
        bodyWeightKg(),
      ]);
      setActivities(saved);
      setWeightKg(kg);
      if (active) {
        // Start a new segment so the gap while the app was closed isn't drawn as a straight line.
        const restored: LiveActivity = {
          ...active,
          segments: [...active.segments, []],
          lastFix: null,
          recent: [],
        };
        commit(restored);
        if (restored.status === "tracking") {
          startWatching();
          keepAwake(true);
        }
      }
      setLoading(false);
    })();
    return () => {
      stopWatching();
      keepAwake(false);
    };
  }, [commit, startWatching, stopWatching, keepAwake]);

  // Pick up deletions made on the activity detail screen.
  useFocusEffect(
    useCallback(() => {
      getItem<Activity[]>(STORAGE_KEYS.ACTIVITIES, []).then(setActivities);
    }, [])
  );

  // 1-second tick for the live clock.
  useEffect(() => {
    if (live?.status !== "tracking") return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [live?.status]);

  const start = useCallback(
    async (type: ActivityType) => {
      const ok = await startWatching();
      if (!ok) return false;
      const t = Date.now();
      commit({
        id: String(t),
        type,
        status: "tracking",
        startedAt: t,
        segments: [[]],
        distanceM: 0,
        movingMsBefore: 0,
        resumedAt: t,
        lastFix: null,
        splits: [],
        recent: [],
      });
      setNow(t);
      keepAwake(true);
      return true;
    },
    [commit, startWatching, keepAwake]
  );

  const pause = useCallback(() => {
    const current = liveRef.current;
    if (!current || current.status !== "tracking") return;
    commit({ ...current, status: "paused", movingMsBefore: movingMs(current), resumedAt: null, recent: [] });
    keepAwake(false);
  }, [commit, keepAwake]);

  const resume = useCallback(async () => {
    const current = liveRef.current;
    if (!current || current.status !== "paused") return;
    await startWatching();
    commit({
      ...current,
      status: "tracking",
      resumedAt: Date.now(),
      segments: [...current.segments, []],
      lastFix: null,
    });
    setNow(Date.now());
    keepAwake(true);
  }, [commit, startWatching, keepAwake]);

  /** Saves the activity to history. Returns it, or null if it was too short to keep. */
  const finish = useCallback(async (): Promise<Activity | null> => {
    const current = liveRef.current;
    if (!current) return null;
    stopWatching();
    keepAwake(false);
    commit(null);

    const movingSeconds = Math.round(movingMs(current) / 1000);
    if (movingSeconds < 10 && current.distanceM < 10) return null;

    const kg = await bodyWeightKg();
    const activity: Activity = {
      id: current.id,
      type: current.type,
      startedAt: new Date(current.startedAt).toISOString(),
      endedAt: new Date().toISOString(),
      movingSeconds,
      distanceM: Math.round(current.distanceM),
      calories: estimateCalories(current.type, current.distanceM, movingSeconds, kg),
      segments: current.segments.filter((s) => s.length > 0),
      splits: current.splits,
    };
    const next = [...activities, activity];
    setActivities(next);
    await setItem(STORAGE_KEYS.ACTIVITIES, next);
    return activity;
  }, [activities, commit, stopWatching, keepAwake]);

  const discard = useCallback(() => {
    stopWatching();
    keepAwake(false);
    commit(null);
  }, [commit, stopWatching, keepAwake]);

  const deleteActivity = useCallback(
    async (id: string) => {
      const next = activities.filter((a) => a.id !== id);
      setActivities(next);
      await setItem(STORAGE_KEYS.ACTIVITIES, next);
    },
    [activities]
  );

  // ---- Live numbers ----
  const status: TrackerStatus = live ? live.status : "idle";
  const movingSeconds = live ? movingMs(live, now) / 1000 : 0;
  const distanceM = live?.distanceM ?? 0;
  let currentPace: { seconds: number; meters: number } | null = null;
  if (live && live.recent.length >= 2) {
    const first = live.recent[0];
    const lastR = live.recent[live.recent.length - 1];
    currentPace = { seconds: (lastR.t - first.t) / 1000, meters: lastR.d - first.d };
  }

  return {
    loading,
    status,
    type: live?.type ?? null,
    segments: live?.segments ?? [],
    distanceM,
    movingSeconds,
    splits: live?.splits ?? [],
    currentPace,
    calories: live ? estimateCalories(live.type, distanceM, movingSeconds, weightKg) : 0,
    gps,
    activities,
    start,
    pause,
    resume,
    finish,
    discard,
    deleteActivity,
  };
}
