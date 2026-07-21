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

export type ChoreFrequency = "once" | "daily" | "weekly";

export interface Chore {
  id: string;
  title: string;
  description?: string;
  assigneeId: string;
  dueDate: string; // YYYY-MM-DD
  frequency: ChoreFrequency;
  points: number;
  completed: boolean;
  completedAt?: string;
  completedById?: string;
}

export type FitnessActivityType =
  | "run"
  | "walk"
  | "bike"
  | "swim"
  | "strength"
  | "yoga"
  | "sports"
  | "other";

export interface FitnessLog {
  id: string;
  memberId: string;
  activityType: FitnessActivityType;
  title: string;
  durationMinutes: number;
  distanceMiles?: number;
  calories?: number;
  notes?: string;
  date: string; // YYYY-MM-DD
  programId?: string;
  completedAt: string;
}

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

export interface AppState {
  members: FamilyMember[];
  events: CalendarEvent[];
  chores: Chore[];
  fitnessLogs: FitnessLog[];
  fitnessPrograms: FitnessProgram[];
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
  bike: "Bike",
  swim: "Swim",
  strength: "Strength",
  yoga: "Yoga",
  sports: "Sports",
  other: "Other",
};

export const ACTIVITY_EMOJIS: Record<FitnessActivityType, string> = {
  run: "🏃",
  walk: "🚶",
  bike: "🚴",
  swim: "🏊",
  strength: "💪",
  yoga: "🧘",
  sports: "⚽",
  other: "🏋️",
};
