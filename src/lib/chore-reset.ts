import type { Chore } from "./types";
import {
  addDays,
  addMonths,
  isSameDay,
  startOfDay,
  startOfWeek,
  toDateKey,
} from "./date-utils";

function startOfMonth(date: Date): Date {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
}

/** True if a completed recurring chore belongs to a previous period. */
export function shouldResetRecurringChore(
  chore: Chore,
  now: Date = new Date()
): boolean {
  if (!chore.completed) return false;
  if (chore.frequency === "once") return false;

  // Prefer completedAt; fall back to dueDate if missing
  const completedRaw = chore.completedAt || chore.dueDate;
  if (!completedRaw) {
    // Marked done with no timestamp — treat as current period still done
    return false;
  }

  const completed = new Date(completedRaw);
  if (Number.isNaN(completed.getTime())) return false;

  switch (chore.frequency) {
    case "daily":
      return !isSameDay(completed, now);
    case "weekly":
      return (
        startOfWeek(completed).getTime() < startOfWeek(now).getTime()
      );
    case "monthly":
      return (
        startOfMonth(completed).getTime() < startOfMonth(now).getTime()
      );
    default:
      return false;
  }
}

/** Next due date after rolling into the current period (if chore had a due date). */
export function rollDueDateForPeriod(
  chore: Chore,
  now: Date = new Date()
): string | undefined {
  if (!chore.dueDate) return undefined;

  const today = toDateKey(now);

  switch (chore.frequency) {
    case "daily":
      return today;
    case "weekly": {
      // Due by end of this week (Saturday, matching startOfWeek = Sunday)
      const weekStart = startOfWeek(now);
      const weekEnd = addDays(weekStart, 6);
      return toDateKey(weekEnd);
    }
    case "monthly": {
      // Due by last day of this month
      const nextMonth = addMonths(startOfMonth(now), 1);
      const monthEnd = addDays(nextMonth, -1);
      return toDateKey(monthEnd);
    }
    default:
      return chore.dueDate;
  }
}

/** Clear completion so the chore is open again for the new period. */
export function resetChoreForNewPeriod(
  chore: Chore,
  now: Date = new Date()
): Chore {
  return {
    ...chore,
    completed: false,
    completedAt: undefined,
    completedById: undefined,
    dueDate: rollDueDateForPeriod(chore, now),
  };
}

/**
 * Apply daily / weekly / monthly resets across the chore list.
 * Returns the same array reference if nothing changed.
 */
export function applyRecurringChoreResets(
  chores: Chore[],
  now: Date = new Date()
): { chores: Chore[]; changed: boolean } {
  let changed = false;
  const next = chores.map((c) => {
    if (!shouldResetRecurringChore(c, now)) return c;
    changed = true;
    return resetChoreForNewPeriod(c, now);
  });
  return { chores: changed ? next : chores, changed };
}
