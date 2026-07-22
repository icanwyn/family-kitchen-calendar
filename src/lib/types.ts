export type CalendarProvider = "google" | "outlook" | "local";

export type MemberRole = "parent" | "child" | "other";

export interface FamilyMember {
  id: string;
  name: string;
  color: string;
  /** @deprecated Prefer avatarImage for modern profiles */
  avatarEmoji: string;
  /** Path to modern avatar image e.g. /avatars/avatar-01.jpg */
  avatarImage?: string;
  role: MemberRole;
  /** Optional contact / login email for this person */
  email?: string;
  calendarConnections: CalendarConnection[];
}

export interface CalendarConnection {
  id: string;
  provider: CalendarProvider;
  accountEmail: string;
  /** Secret ICS / iCal feed URL from Google or Outlook (primary sync method) */
  icsUrl?: string;
  connectedAt: string;
  lastSyncedAt: string | null;
  status: "connected" | "syncing" | "error" | "disconnected";
  lastError?: string;
  lastEventCount?: number;
}

export type EventCategory =
  | "general"
  | "school"
  | "work"
  | "sports"
  | "appointment"
  | "family"
  | "other";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  memberId: string;
  start: string; // ISO
  end: string; // ISO
  allDay: boolean;
  category: EventCategory;
  location?: string;
  source: CalendarProvider;
  externalId?: string;
}

export type ChoreFrequency = "once" | "daily" | "weekly" | "monthly";

export interface Chore {
  id: string;
  title: string;
  description?: string;
  /** @deprecated Prefer assigneeIds — kept for older local data */
  assigneeId?: string;
  /** One or more family members responsible */
  assigneeIds: string[];
  /** YYYY-MM-DD — omit for open tasks with no due date */
  dueDate?: string;
  frequency: ChoreFrequency;
  points: number;
  completed: boolean;
  completedAt?: string;
  completedById?: string;
}

/** Normalize legacy chores that only had assigneeId / required dueDate */
export function choreAssigneeIds(chore: Chore): string[] {
  if (Array.isArray(chore.assigneeIds) && chore.assigneeIds.length > 0) {
    return chore.assigneeIds;
  }
  if (chore.assigneeId) return [chore.assigneeId];
  return [];
}

export type FitnessActivityType =
  | "run"
  | "walk"
  | "steps"
  | "hike"
  | "bike"
  | "swim"
  | "strength"
  | "yoga"
  | "sports"
  | "hiit"
  | "other";

export interface FitnessSetLog {
  reps: number;
  weight?: number;
  done: boolean;
}

export interface FitnessExerciseLog {
  exerciseId: string;
  name: string;
  sets: FitnessSetLog[];
}

export interface FitnessLog {
  id: string;
  memberId: string;
  activityType: FitnessActivityType;
  title: string;
  durationMinutes: number;
  distanceMiles?: number;
  steps?: number;
  calories?: number;
  notes?: string;
  date: string; // YYYY-MM-DD
  /** Freeform activity vs structured program session */
  source?: "activity" | "program";
  programId?: string;
  sessionDayId?: string;
  exerciseLogs?: FitnessExerciseLog[];
  completedAt: string;
}

/** Lightweight goal-style program (legacy / simple weekly goals) */
export interface FitnessProgram {
  id: string;
  name: string;
  description?: string;
  memberId: string;
  weeklyGoalSessions: number;
  weeklyGoalMinutes: number;
  activityTypes: FitnessActivityType[];
  color: string;
  active: boolean;
}

/** Mori-style 4-week personalized training plan */
export interface WorkoutProgramExercise {
  exerciseId: string;
  name: string;
  pattern: string;
  sets: number;
  repMin: number;
  repMax: number;
  repsLabel: string;
  restSec: number;
  rir: number;
  cues?: string;
  compound?: boolean;
}

export interface WorkoutProgramDay {
  id: string;
  date: string;
  dayName: string;
  type: "rt" | "cardio" | "rest";
  title: string;
  templateKey?: string;
  exercises: WorkoutProgramExercise[];
  estimatedMinutes: number;
  warmup?: string[];
  cooldown?: string[];
  notes?: string;
  deload?: boolean;
}

export interface WorkoutProgramWeek {
  week: number;
  startDate: string;
  deload: boolean;
  volumeMultiplier: number;
  days: WorkoutProgramDay[];
}

export interface WorkoutProgram {
  id: string;
  memberId: string;
  name?: string;
  createdAt: string;
  split: string;
  primaryGoal: string;
  primaryGoalLabel: string;
  weeklySetsTarget: number;
  rtDaysPerWeek: number;
  progressionRule: string;
  progressionNotes: string;
  /** daily = every available day; weekly = those days each week; monthly = week 1 only */
  scheduleRepeat?: "daily" | "weekly" | "monthly";
  /** JS weekday numbers 0=Sun … 6=Sat the user can train */
  availableDays?: number[];
  profileSnapshot: {
    age: number;
    weight?: number | string;
    height?: number | string;
    units?: string;
    goals: string[];
    equipment: string[];
    experience: string;
    daysPerWeek: number;
    availableDays?: number[];
    scheduleRepeat?: "daily" | "weekly" | "monthly";
    name?: string;
  };
  weeks: WorkoutProgramWeek[];
  active: boolean;
}

export interface AppState {
  members: FamilyMember[];
  events: CalendarEvent[];
  chores: Chore[];
  fitnessLogs: FitnessLog[];
  fitnessPrograms: FitnessProgram[];
  /** Mori-style structured training plans */
  workoutPrograms: WorkoutProgram[];
  activeMemberId: string | null;
  familyName: string;
}

export type ViewId = "today" | "calendar" | "chores" | "fitness" | "family";

export const MEMBER_COLORS = [
  "#3B82F6", // blue
  "#EC4899", // pink
  "#10B981", // emerald
  "#F59E0B", // amber
  "#8B5CF6", // violet
  "#EF4444", // red
  "#06B6D4", // cyan
  "#F97316", // orange
] as const;

export const AVATAR_EMOJIS = [
  "👨",
  "👩",
  "👦",
  "👧",
  "🧑",
  "👴",
  "👵",
  "🧒",
  "👶",
  "🐶",
  "🐱",
  "🦊",
  "🐻",
  "🦁",
  "🌟",
] as const;

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  general: "General",
  school: "School",
  work: "Work",
  sports: "Sports",
  appointment: "Appointment",
  family: "Family",
  other: "Other",
};

export const ACTIVITY_LABELS: Record<FitnessActivityType, string> = {
  run: "Run",
  walk: "Walk",
  steps: "Steps",
  hike: "Hike",
  bike: "Bike",
  swim: "Swim",
  strength: "Strength",
  yoga: "Yoga",
  sports: "Sports",
  hiit: "HIIT",
  other: "Other",
};

export const ACTIVITY_EMOJIS: Record<FitnessActivityType, string> = {
  run: "🏃",
  walk: "🚶",
  steps: "👟",
  hike: "🥾",
  bike: "🚴",
  swim: "🏊",
  strength: "💪",
  yoga: "🧘",
  sports: "⚽",
  hiit: "⚡",
  other: "🏋️",
};
