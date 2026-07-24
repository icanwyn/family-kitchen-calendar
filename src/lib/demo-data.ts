import type { AppState } from "./types";

/** Empty family calendar — no stock/demo members or events. */
export const EMPTY_STATE: AppState = {
  familyName: "My Family",
  activeMemberId: null,
  members: [],
  events: [],
  chores: [],
  fitnessLogs: [],
  fitnessPrograms: [],
  workoutPrograms: [],
  pointsLedger: [],
};

/** @deprecated use EMPTY_STATE */
export const DEMO_STATE = EMPTY_STATE;
