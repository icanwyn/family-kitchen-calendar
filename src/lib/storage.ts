import type { AppState, Chore } from "./types";
import { EMPTY_STATE } from "./demo-data";
import { deepClone } from "./clone";

const STORAGE_KEY = "family-kitchen-calendar-v3";

function normalizeChore(raw: Partial<Chore> & { id?: string }): Chore {
  const ids =
    Array.isArray(raw.assigneeIds) && raw.assigneeIds.length > 0
      ? raw.assigneeIds
      : raw.assigneeId
        ? [raw.assigneeId]
        : [];
  return {
    id: raw.id || `ch_${Math.random().toString(36).slice(2)}`,
    title: raw.title || "Untitled",
    description: raw.description,
    assigneeIds: ids,
    assigneeId: ids[0],
    dueDate: raw.dueDate || undefined,
    frequency:
      raw.frequency === "daily" ||
      raw.frequency === "weekly" ||
      raw.frequency === "monthly" ||
      raw.frequency === "once"
        ? raw.frequency
        : "once",
    points: typeof raw.points === "number" ? raw.points : 5,
    completed: !!raw.completed,
    completedAt: raw.completedAt,
    completedById: raw.completedById,
  };
}

export function loadState(): AppState {
  if (typeof window === "undefined") return deepClone(EMPTY_STATE);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return deepClone(EMPTY_STATE);
    const parsed = JSON.parse(raw) as AppState;
    return {
      ...deepClone(EMPTY_STATE),
      ...parsed,
      members: Array.isArray(parsed.members) ? parsed.members : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
      chores: Array.isArray(parsed.chores)
        ? parsed.chores.map((c) => normalizeChore(c as Chore))
        : [],
      fitnessLogs: Array.isArray(parsed.fitnessLogs) ? parsed.fitnessLogs : [],
      fitnessPrograms: Array.isArray(parsed.fitnessPrograms)
        ? parsed.fitnessPrograms
        : [],
      workoutPrograms: Array.isArray(parsed.workoutPrograms)
        ? parsed.workoutPrograms
        : [],
    };
  } catch {
    return deepClone(EMPTY_STATE);
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function resetState(): AppState {
  const fresh = deepClone(EMPTY_STATE);
  saveState(fresh);
  // Also clear old demo keys if present
  try {
    localStorage.removeItem("family-kitchen-calendar-v1");
    localStorage.removeItem("family-kitchen-calendar-v2");
  } catch {
    /* ignore */
  }
  return fresh;
}
