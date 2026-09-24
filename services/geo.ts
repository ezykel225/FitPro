// services/geo.ts
// Distance / pace / calorie math and formatting for walk & run tracking.

import { Activity, ActivityType, LatLng } from "../constants/types";

const EARTH_RADIUS_M = 6371000;

/** Great-circle distance in metres between two [lat, lng] points. */
export function haversineM(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** 1:05:09 or 12:34 */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(sec).padStart(2, "0")}`;
}

/** Pace as "m:ss" per km, or "--:--" when there isn't enough distance. */
export function formatPace(seconds: number, meters: number): string {
  if (meters < 20 || seconds <= 0) return "--:--";
  const secPerKm = seconds / (meters / 1000);
  if (secPerKm > 60 * 60) return "--:--";
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return s === 60 ? `${m + 1}:00` : `${m}:${String(s).padStart(2, "0")}`;
}

export function formatKm(meters: number): string {
  return (meters / 1000).toFixed(2);
}

/**
 * Estimated calories burned: MET × body weight (kg) × hours.
 * Walking ~3.5 MET at a normal pace; running scales with speed (~1 MET per km/h).
 */
export function estimateCalories(type: ActivityType, meters: number, seconds: number, weightKg: number): number {
  if (seconds <= 0) return 0;
  const kmh = meters / 1000 / (seconds / 3600);
  const met = type === "run" ? Math.max(7, kmh) : kmh > 5.5 ? 4.5 : 3.5;
  return Math.round(met * weightKg * (seconds / 3600));
}

/** "Morning Walk", "Evening Run" ... */
export function activityTitle(activity: Pick<Activity, "type" | "startedAt">): string {
  const hour = new Date(activity.startedAt).getHours();
  const part = hour < 5 ? "Night" : hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : hour < 21 ? "Evening" : "Night";
  return `${part} ${activity.type === "run" ? "Run" : "Walk"}`;
}
