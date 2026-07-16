// constants/theme.ts
// Design tokens for FitPro.
//
// Direction: dark-mode-first, "premium fitness tech" - modeled on the
// visual language of Nike Training Club / Strong / Apple Fitness. A deep
// navy-black base with two signature blues (accent + highlight) instead
// of a single warm color, so the app reads as modern and screen-friendly
// for night/post-workout use rather than a flat white "clinical tracker."

export const palette = {
  blue: "#3B82F6", // primary accent - CTAs, active states, primary buttons
  blueDeep: "#2563EB",
  cyan: "#22D3EE", // highlight - progress, streaks, charts, data
  mint: "#10B981", // success / completed
  amber: "#F59E0B", // warning / calories
  red: "#EF4444", // danger / delete / reset
  white: "#FFFFFF",
  black: "#000000",
};

export const darkTheme = {
  mode: "dark" as const,
  background: "#0B0F19",
  surface: "#1F2937",
  surfaceAlt: "#111827", // secondary surface - nav bar, section backgrounds
  text: "#F9FAFB",
  subtext: "#9CA3AF",
  border: "#273244",
  primary: palette.blue,
  primaryDeep: palette.blueDeep,
  success: palette.mint,
  warning: palette.amber,
  danger: palette.red,
  info: palette.cyan,
  ...palette,
};

export const lightTheme = {
  mode: "light" as const,
  background: "#F3F4F6",
  surface: "#FFFFFF",
  surfaceAlt: "#EEF2FF",
  text: "#0B0F19",
  subtext: "#6B7280",
  border: "#E5E7EB",
  primary: palette.blue,
  primaryDeep: palette.blueDeep,
  success: palette.mint,
  warning: palette.amber,
  danger: palette.red,
  info: palette.cyan,
  ...palette,
};

export type Theme = typeof lightTheme | typeof darkTheme;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
};

/** Gradient pairs used for the Home hero card and stat-icon badges. */
export const gradients = {
  hero: ["#1E3A8A", "#0B0F19"] as const, // deep blue -> background, the signature "hero" moment
  cyan: ["#22D3EE", "#0891B2"] as const,
  mint: ["#10B981", "#059669"] as const,
  amber: ["#F59E0B", "#D97706"] as const,
};
