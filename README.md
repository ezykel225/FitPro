# FitPro: The Lazy Fitness Assistant 🏋️‍♂️🥑

A mobile fitness app built with **Expo + React Native + TypeScript** that automates workout
tracking, calorie monitoring, and progress management — designed for people who want results
without a complicated system.

## 📱 Features

| Screen | What it does |
|---|---|
| **Home** | Welcome message, daily motivational quote, streak, calories today, workout %, quick actions |
| **Workout** | Mon-Fri PPL plan (Push / Pull / Legs / Push 2 / Pull 2) for 10-20lb dumbbells + bench. Log weight & reps per set, weekly double-progression targets, swap any exercise for an alternative, rest timer |
| **Run** | Strava-style GPS walk/run tracking: live map, time, distance, pace, per-km splits, calories, activity history |
| **Nutrition** | Fat-loss targets (~2,550 kcal · 170g protein), 12pm-8pm eating window, one-tap Meal 1 / Meal 2 plan meals, what to eat vs. cut back on, custom meals |
| **Progress** | Weight log, 7-entry line chart, goal tracking, body stats, link to Awards |
| **Achievements** | Badges for streaks, workout counts, and meal logging (opened from Progress) |
| **Settings** | Edit profile & goals, dark mode, notifications toggle, reset all data |

### How the weekly progression works

- **Dumbbell lifts (double progression):** same weight until every set hits the top of the rep range, then level up: heavier dumbbells → slow 3-4s lowering once you're at 20lb → a 4th set → 60s rest instead of 90s.
- **Push-ups (AMRAP) & bodyweight reps:** beat last session's reps. At 20+ push-ups, go to a narrower grip or add a backpack.
- **Timed holds:** seconds go up automatically each program week.

## 📲 Install on iPhone (free)

The app is published as a web app on GitHub Pages. Open **https://ezykel225.github.io/FitPro/** in Safari, tap **Share → Add to Home Screen**. Data stays on the phone. For GPS tracking, keep the app open with the screen on - iPhone pauses GPS for web apps in the background.

## 🧱 Tech Stack

- **Expo** (managed workflow) + **Expo Router** (file-based navigation)
- **TypeScript** (strict mode)
- **AsyncStorage** for local persistence (no backend needed)
- **react-native-chart-kit** + `react-native-svg` for the weight trend chart
- **React Context** (`ThemeContext`) for global dark-mode state
- **Custom hooks** (`useWorkout`, `useNutrition`, `useProgress`, `useAchievements`, `useSettings`)

## 📂 Project Structure

```
FitPro/
├── app/
│   ├── _layout.tsx                # Root layout, wraps app in ThemeProvider
│   └── (tabs)/
│       ├── _layout.tsx            # Bottom tab bar (Expo Router)
│       ├── index.tsx              # Home screen
│       ├── workout.tsx            # Workout screen
│       ├── nutrition.tsx          # Nutrition screen
│       ├── progress.tsx           # Progress screen
│       ├── achievements.tsx       # Achievements screen
│       └── settings.tsx           # Settings screen
├── components/
│   ├── Header.tsx
│   ├── Card.tsx
│   ├── ProgressBar.tsx
│   ├── WorkoutCard.tsx
│   ├── StatPill.tsx
│   └── Navigation.tsx             # Quick-action grid on Home
├── context/
│   └── ThemeContext.tsx           # Dark mode via useContext
├── hooks/
│   ├── useWorkout.ts
│   ├── useNutrition.ts
│   ├── useProgress.ts
│   ├── useAchievements.ts
│   └── useSettings.ts
├── services/
│   └── storage.ts                 # AsyncStorage wrapper (single source of truth)
├── constants/
│   ├── types.ts                   # Shared TypeScript interfaces
│   ├── theme.ts                   # Colors, spacing, radius tokens
│   └── data.ts                    # Default workouts, quotes, badges, goals
├── assets/
├── app.json
├── babel.config.js
├── tsconfig.json
├── package.json
└── README.md
```

> **Note on `Navigation.tsx`:** screen-to-screen navigation itself is handled by Expo Router's
> file-based `(tabs)` group — that's what satisfies the "functional navigation" requirement.
> `components/Navigation.tsx` is a *reusable component* on top of that: a quick-action grid on
> the Home screen so a "lazy" user can jump straight into logging a workout or meal in one tap.

## 🚀 Getting Started

### 1. Install dependencies

```bash
cd FitPro
npm install
```

### 2. Run the project

```bash
npx expo start
```

Then:
- Press `a` to open on an Android emulator
- Press `i` to open on an iOS simulator (macOS only)
- Press `w` to open in a browser
- Or scan the QR code with the **Expo Go** app on your phone

### 3. Where files go

All files already match the structure above — just place each file at the path shown when you
copy it into your own project folder (e.g. `hooks/useWorkout.ts` goes inside `FitPro/hooks/`).

## 🗂️ Git & GitHub Workflow (for the weekly commits requirement)

```bash
git init
git add .
git commit -m "Week 1: project scaffold, Expo Router, folder structure"
git branch -M main
git remote add origin https://github.com/<your-username>/fitpro-lazy-fitness-assistant.git
git push -u origin main
```

Suggested weekly commit messages (matches the development plan below):

```
Week 1: Initialize Expo project, configure Expo Router, folder structure
Week 2: Home screen, navigation, reusable components (Header, Card, ProgressBar)
Week 3: Workout screen + useWorkout hook + rest timer
Week 4: Nutrition screen + useNutrition hook
Week 5: Progress screen + weight chart + useProgress hook
Week 6: Achievements screen + useAchievements hook + badge logic
Week 7: Settings screen + useSettings hook + dark mode context
Week 8: Testing and bug fixes
Week 9: Final UI polish
Week 10: Documentation and final submission
```

## 🧪 Testing Checklist

- [ ] Toggle exercises complete/incomplete on Workout screen
- [ ] Rest timer counts down and can be skipped
- [ ] Finishing a workout at 100% increases streak by 1 (only once per day)
- [ ] Adding a meal updates the Nutrition daily summary bars
- [ ] Logging weight adds a point to the Progress chart (need 2+ entries to render)
- [ ] Badges unlock automatically (e.g. "First Step" after first 100% workout)
- [ ] Dark mode toggle in Settings updates every screen
- [ ] "Reset All Data" clears AsyncStorage and returns app to defaults

## 📌 Problem Statement & Solution

**Problem:** Many people are too lazy/busy to track workouts, count calories, monitor progress,
stay motivated, plan meals, or remember exercise schedules.

**Solution:** FitPro automates fitness management with pre-built workout plans, one-tap meal
logging, automatic streak/badge tracking, and a simple dashboard — reducing effort while
improving consistency and health outcomes.

## 📄 License

Academic/capstone project — free to use and modify for coursework.
