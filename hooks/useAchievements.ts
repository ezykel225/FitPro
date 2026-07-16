// hooks/useAchievements.ts
// Tracks badge unlock state. Exposes a `checkAndUnlock` function that
// screens call after a relevant event (e.g. finishing a workout, logging
// a meal) so badges unlock automatically without polling.

import { useState, useEffect, useCallback } from "react";
import { Badge } from "../constants/types";
import { DEFAULT_BADGES } from "../constants/data";
import { getItem, setItem, STORAGE_KEYS } from "../services/storage";

export interface AchievementStats {
  currentStreak: number;
  totalWorkoutsCompleted: number;
  totalMealsLogged: number;
}

export function useAchievements() {
  const [badges, setBadges] = useState<Badge[]>(DEFAULT_BADGES);
  const [loading, setLoading] = useState(true);
  const [recentlyUnlocked, setRecentlyUnlocked] = useState<Badge | null>(null);

  useEffect(() => {
    (async () => {
      const saved = await getItem<Badge[]>(STORAGE_KEYS.BADGES, DEFAULT_BADGES);
      setBadges(saved);
      setLoading(false);
    })();
  }, []);

  const checkAndUnlock = useCallback(
    async (stats: AchievementStats) => {
      let didUnlockNew = false;
      let firstNewBadge: Badge | null = null;

      const next = badges.map((badge) => {
        if (badge.unlocked) return badge;

        let shouldUnlock = false;
        switch (badge.id) {
          case "first-workout":
            shouldUnlock = stats.totalWorkoutsCompleted >= 1;
            break;
          case "streak-3":
            shouldUnlock = stats.currentStreak >= 3;
            break;
          case "streak-7":
            shouldUnlock = stats.currentStreak >= 7;
            break;
          case "streak-30":
            shouldUnlock = stats.currentStreak >= 30;
            break;
          case "workouts-10":
            shouldUnlock = stats.totalWorkoutsCompleted >= 10;
            break;
          case "workouts-50":
            shouldUnlock = stats.totalWorkoutsCompleted >= 50;
            break;
          case "first-meal":
            shouldUnlock = stats.totalMealsLogged >= 1;
            break;
          default:
            shouldUnlock = false;
        }

        if (shouldUnlock) {
          didUnlockNew = true;
          const unlockedBadge: Badge = {
            ...badge,
            unlocked: true,
            unlockedAt: new Date().toISOString(),
          };
          if (!firstNewBadge) firstNewBadge = unlockedBadge;
          return unlockedBadge;
        }
        return badge;
      });

      if (didUnlockNew) {
        setBadges(next);
        await setItem(STORAGE_KEYS.BADGES, next);
        setRecentlyUnlocked(firstNewBadge);
      }
    },
    [badges]
  );

  const clearRecentlyUnlocked = useCallback(() => setRecentlyUnlocked(null), []);

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return {
    loading,
    badges,
    unlockedCount,
    checkAndUnlock,
    recentlyUnlocked,
    clearRecentlyUnlocked,
  };
}
