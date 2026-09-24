// services/dates.ts
// Local-time date helpers. toISOString() is UTC, which puts early-morning
// workouts on the wrong day in timezones ahead of UTC, so everything here
// works in the phone's local time.

/** yyyy-mm-dd in local time. */
export function localISO(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parses a local yyyy-mm-dd into a Date at local midnight. */
export function parseLocalISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Monday of the week containing `date`, as local yyyy-mm-dd. */
export function mondayOf(date: Date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (d.getDay() + 6) % 7; // Mon=0 ... Sun=6
  d.setDate(d.getDate() - offset);
  return localISO(d);
}

/** 1-based program week for `today`, counting from the Monday `startDate`. */
export function programWeek(startDate: string, today: Date = new Date()): number {
  const start = parseLocalISO(startDate).getTime();
  const thisMonday = parseLocalISO(mondayOf(today)).getTime();
  const weeks = Math.round((thisMonday - start) / (7 * 24 * 3600 * 1000));
  return Math.max(1, weeks + 1);
}

/** 1 = Monday ... 7 = Sunday */
export function isoWeekday(date: Date = new Date()): number {
  return ((date.getDay() + 6) % 7) + 1;
}

/** The most recent training day (Mon-Fri) strictly before `iso`. */
export function previousTrainingDay(iso: string): string {
  const d = parseLocalISO(iso);
  do {
    d.setDate(d.getDate() - 1);
  } while (isoWeekday(d) > 5);
  return localISO(d);
}

/** "Sep 17" */
export function shortDate(iso: string): string {
  return parseLocalISO(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
