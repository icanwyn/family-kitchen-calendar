import type { AppState } from "./types";
import { EMPTY_STATE } from "./demo-data";
import { deepClone } from "./clone";

const STORAGE_KEY = "family-kitchen-calendar-v3";

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
      chores: Array.isArray(parsed.chores) ? parsed.chores : [],
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
