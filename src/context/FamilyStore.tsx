"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AppState,
  CalendarConnection,
  CalendarEvent,
  Chore,
  FamilyMember,
  FitnessLog,
  FitnessProgram,
  PointsEntry,
  WorkoutProgram,
} from "@/lib/types";
import { choreAssigneeIds } from "@/lib/types";
import { loadState, resetState, saveState } from "@/lib/storage";
import { uid } from "@/lib/date-utils";
import { ICS_FUTURE_DAYS, ICS_PAST_DAYS, parseIcs } from "@/lib/ics";
import { deepClone } from "@/lib/clone";
import { applyRecurringChoreResets } from "@/lib/chore-reset";
import { monthKeyFromDate } from "@/lib/points";

interface FamilyStoreValue extends AppState {
  hydrated: boolean;
  setActiveMember: (id: string | null) => void;
  setFamilyName: (name: string) => void;
  addMember: (member: Omit<FamilyMember, "id" | "calendarConnections">) => void;
  updateMember: (id: string, patch: Partial<FamilyMember>) => void;
  removeMember: (id: string) => void;
  addEvent: (event: Omit<CalendarEvent, "id">) => void;
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => void;
  removeEvent: (id: string) => void;
  addChore: (chore: Omit<Chore, "id" | "completed">) => void;
  updateChore: (id: string, patch: Partial<Chore>) => void;
  toggleChore: (id: string, completedById?: string) => void;
  removeChore: (id: string) => void;
  addFitnessLog: (log: Omit<FitnessLog, "id" | "completedAt">) => void;
  removeFitnessLog: (id: string) => void;
  addFitnessProgram: (program: Omit<FitnessProgram, "id">) => void;
  updateFitnessProgram: (id: string, patch: Partial<FitnessProgram>) => void;
  removeFitnessProgram: (id: string) => void;
  addWorkoutProgram: (program: WorkoutProgram) => void;
  updateWorkoutProgram: (id: string, patch: Partial<WorkoutProgram>) => void;
  removeWorkoutProgram: (id: string) => void;
  setActiveWorkoutProgram: (id: string, memberId: string) => void;
  connectCalendar: (
    memberId: string,
    provider: "google" | "outlook",
    options: { email: string; icsUrl?: string }
  ) => string;
  disconnectCalendar: (memberId: string, connectionId: string) => void;
  /** Returns number of events imported, or throws */
  syncCalendar: (memberId: string, connectionId: string) => Promise<number>;
  resetDemo: () => void;
  getMember: (id: string) => FamilyMember | undefined;
  /** Current rewards month key YYYY-MM */
  rewardsMonthKey: string;
}

const FamilyStoreContext = createContext<FamilyStoreValue | null>(null);

/** SSR-safe empty shell — real data hydrates on client after mount. */
const EMPTY_SAFE: AppState = {
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

export function FamilyStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => deepClone(EMPTY_SAFE));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setState(loadState());
    } catch (err) {
      console.error("Failed to load calendar state", err);
      setState(deepClone(EMPTY_SAFE));
    }
    setHydrated(true);
  }, []);

  // Re-check recurring chore resets when the calendar day changes (and on an interval)
  useEffect(() => {
    if (!hydrated) return;

    const roll = () => {
      setState((prev) => {
        const { chores, changed } = applyRecurringChoreResets(prev.chores);
        if (!changed) return prev;
        return { ...prev, chores };
      });
    };

    roll();

    // Poll every 60s so midnight rollover is picked up without a full refresh
    const interval = window.setInterval(roll, 60_000);

    // Also roll when the tab becomes visible again (e.g. kitchen tablet overnight)
    const onVisible = () => {
      if (document.visibilityState === "visible") roll();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [hydrated]);

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  const update = useCallback((fn: (prev: AppState) => AppState) => {
    setState((prev) => fn(prev));
  }, []);

  const value = useMemo<FamilyStoreValue>(() => {
    return {
      ...state,
      workoutPrograms: state.workoutPrograms ?? [],
      fitnessPrograms: state.fitnessPrograms ?? [],
      fitnessLogs: state.fitnessLogs ?? [],
      pointsLedger: state.pointsLedger ?? [],
      rewardsMonthKey: monthKeyFromDate(),
      hydrated,
      setActiveMember: (id) => update((s) => ({ ...s, activeMemberId: id })),
      setFamilyName: (name) => update((s) => ({ ...s, familyName: name })),
      addMember: (member) =>
        update((s) => ({
          ...s,
          members: [
            ...s.members,
            { ...member, id: uid("m"), calendarConnections: [] },
          ],
        })),
      updateMember: (id, patch) =>
        update((s) => ({
          ...s,
          members: s.members.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),
      removeMember: (id) =>
        update((s) => ({
          ...s,
          members: s.members.filter((m) => m.id !== id),
          events: s.events.filter((e) => e.memberId !== id),
          chores: s.chores
            .map((c) => {
              const ids = choreAssigneeIds(c).filter((aid) => aid !== id);
              if (ids.length === 0 && choreAssigneeIds(c).includes(id)) {
                return null;
              }
              if (choreAssigneeIds(c).includes(id)) {
                return {
                  ...c,
                  assigneeIds: ids,
                  assigneeId: ids[0],
                };
              }
              return c;
            })
            .filter(Boolean) as Chore[],
          fitnessLogs: s.fitnessLogs.filter((f) => f.memberId !== id),
          fitnessPrograms: s.fitnessPrograms.filter((p) => p.memberId !== id),
          workoutPrograms: (s.workoutPrograms || []).filter(
            (p) => p.memberId !== id
          ),
          // Keep points history under a placeholder name if member removed
          pointsLedger: s.pointsLedger ?? [],
          activeMemberId:
            s.activeMemberId === id
              ? s.members.find((m) => m.id !== id)?.id ?? null
              : s.activeMemberId,
        })),
      addEvent: (event) =>
        update((s) => ({
          ...s,
          events: [...s.events, { ...event, id: uid("e") }],
        })),
      updateEvent: (id, patch) =>
        update((s) => ({
          ...s,
          events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),
      removeEvent: (id) =>
        update((s) => ({
          ...s,
          events: s.events.filter((e) => e.id !== id),
        })),
      addChore: (chore) =>
        update((s) => {
          const ids =
            chore.assigneeIds?.length > 0
              ? chore.assigneeIds
              : chore.assigneeId
                ? [chore.assigneeId]
                : [];
          return {
            ...s,
            chores: [
              ...s.chores,
              {
                ...chore,
                id: uid("ch"),
                completed: false,
                assigneeIds: ids,
                assigneeId: ids[0],
                dueDate: chore.dueDate || undefined,
              },
            ],
          };
        }),
      updateChore: (id, patch) =>
        update((s) => ({
          ...s,
          chores: s.chores.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      toggleChore: (id, completedById) =>
        update((s) => {
          const chore = s.chores.find((c) => c.id === id);
          if (!chore) return s;

          if (chore.completed) {
            // Un-complete: reverse points awarded for this completion
            const ledger = (s.pointsLedger ?? []).filter(
              (e) =>
                !(
                  e.choreId === id &&
                  chore.completedAt &&
                  e.earnedAt === chore.completedAt
                )
            );
            return {
              ...s,
              pointsLedger: ledger,
              chores: s.chores.map((c) =>
                c.id === id
                  ? {
                      ...c,
                      completed: false,
                      completedAt: undefined,
                      completedById: undefined,
                    }
                  : c
              ),
            };
          }

          const now = new Date();
          const earnedAt = now.toISOString();
          const who =
            completedById ??
            s.activeMemberId ??
            choreAssigneeIds(chore)[0];
          const pts = Math.max(0, chore.points || 0);
          const ledger = [...(s.pointsLedger ?? [])];
          if (who && pts > 0) {
            const entry: PointsEntry = {
              id: uid("pts"),
              memberId: who,
              choreId: chore.id,
              choreTitle: chore.title,
              points: pts,
              earnedAt,
              monthKey: monthKeyFromDate(now),
            };
            ledger.push(entry);
          }

          return {
            ...s,
            pointsLedger: ledger,
            chores: s.chores.map((c) =>
              c.id === id
                ? {
                    ...c,
                    completed: true,
                    completedAt: earnedAt,
                    completedById: who,
                  }
                : c
            ),
          };
        }),
      removeChore: (id) =>
        update((s) => ({
          ...s,
          chores: s.chores.filter((c) => c.id !== id),
          // Keep past points even if chore is deleted (rewards history)
        })),
      addFitnessLog: (log) =>
        update((s) => ({
          ...s,
          fitnessLogs: [
            ...s.fitnessLogs,
            {
              ...log,
              id: uid("f"),
              completedAt: new Date().toISOString(),
            },
          ],
        })),
      removeFitnessLog: (id) =>
        update((s) => ({
          ...s,
          fitnessLogs: s.fitnessLogs.filter((f) => f.id !== id),
        })),
      addFitnessProgram: (program) =>
        update((s) => ({
          ...s,
          fitnessPrograms: [
            ...s.fitnessPrograms,
            { ...program, id: uid("p") },
          ],
        })),
      updateFitnessProgram: (id, patch) =>
        update((s) => ({
          ...s,
          fitnessPrograms: s.fitnessPrograms.map((p) =>
            p.id === id ? { ...p, ...patch } : p
          ),
        })),
      removeFitnessProgram: (id) =>
        update((s) => ({
          ...s,
          fitnessPrograms: s.fitnessPrograms.filter((p) => p.id !== id),
        })),
      addWorkoutProgram: (program) =>
        update((s) => {
          const existing = Array.isArray(s.workoutPrograms)
            ? s.workoutPrograms
            : [];
          return {
            ...s,
            workoutPrograms: [
              ...existing.map((p) =>
                p.memberId === program.memberId && program.active
                  ? { ...p, active: false }
                  : p
              ),
              program,
            ],
          };
        }),
      updateWorkoutProgram: (id, patch) =>
        update((s) => ({
          ...s,
          workoutPrograms: (s.workoutPrograms ?? []).map((p) =>
            p.id === id ? { ...p, ...patch } : p
          ),
        })),
      removeWorkoutProgram: (id) =>
        update((s) => ({
          ...s,
          workoutPrograms: (s.workoutPrograms ?? []).filter((p) => p.id !== id),
        })),
      setActiveWorkoutProgram: (id, memberId) =>
        update((s) => ({
          ...s,
          workoutPrograms: (s.workoutPrograms ?? []).map((p) =>
            p.memberId === memberId
              ? { ...p, active: p.id === id }
              : p
          ),
        })),
      connectCalendar: (memberId, provider, options) => {
        const connection: CalendarConnection = {
          id: uid("c"),
          provider,
          accountEmail: options.email,
          icsUrl: options.icsUrl?.trim() || undefined,
          connectedAt: new Date().toISOString(),
          lastSyncedAt: options.icsUrl ? null : new Date().toISOString(),
          status: "connected",
        };
        update((s) => ({
          ...s,
          members: s.members.map((m) =>
            m.id === memberId
              ? {
                  ...m,
                  email: m.email || options.email,
                  calendarConnections: [
                    ...m.calendarConnections.filter(
                      (c) => c.provider !== provider
                    ),
                    connection,
                  ],
                }
              : m
          ),
        }));
        return connection.id;
      },
      disconnectCalendar: (memberId, connectionId) =>
        update((s) => {
          const member = s.members.find((m) => m.id === memberId);
          const conn = member?.calendarConnections.find(
            (c) => c.id === connectionId
          );
          return {
            ...s,
            members: s.members.map((m) =>
              m.id === memberId
                ? {
                    ...m,
                    calendarConnections: m.calendarConnections.filter(
                      (c) => c.id !== connectionId
                    ),
                  }
                : m
            ),
            // Drop imported events from this provider for this member
            events: conn
              ? s.events.filter(
                  (e) =>
                    !(
                      e.memberId === memberId &&
                      e.source === conn.provider &&
                      e.externalId
                    )
                )
              : s.events,
          };
        }),
      syncCalendar: async (memberId, connectionId) => {
        // Functional update always sees the latest committed state (incl. just-added connections)
        let connection: CalendarConnection | undefined;
        update((s) => {
          const member = s.members.find((m) => m.id === memberId);
          connection = member?.calendarConnections.find(
            (c) => c.id === connectionId
          );
          if (!connection) return s;
          return {
            ...s,
            members: s.members.map((m) =>
              m.id === memberId
                ? {
                    ...m,
                    calendarConnections: m.calendarConnections.map((c) =>
                      c.id === connectionId
                        ? {
                            ...c,
                            status: "syncing" as const,
                            lastError: undefined,
                          }
                        : c
                    ),
                  }
                : m
            ),
          };
        });

        if (!connection) {
          // One retry after a tick in case connect just queued state
          await new Promise((r) => setTimeout(r, 50));
          update((s) => {
            const member = s.members.find((m) => m.id === memberId);
            connection = member?.calendarConnections.find(
              (c) => c.id === connectionId
            );
            if (!connection) return s;
            return {
              ...s,
              members: s.members.map((m) =>
                m.id === memberId
                  ? {
                      ...m,
                      calendarConnections: m.calendarConnections.map((c) =>
                        c.id === connectionId
                          ? {
                              ...c,
                              status: "syncing" as const,
                              lastError: undefined,
                            }
                          : c
                      ),
                    }
                  : m
              ),
            };
          });
        }

        if (!connection) throw new Error("Connection not found");

        // Demo link without ICS — just mark synced
        if (!connection.icsUrl) {
          await new Promise((r) => setTimeout(r, 800));
          update((s) => ({
            ...s,
            members: s.members.map((m) =>
              m.id === memberId
                ? {
                    ...m,
                    calendarConnections: m.calendarConnections.map((c) =>
                      c.id === connectionId
                        ? {
                            ...c,
                            status: "connected" as const,
                            lastSyncedAt: new Date().toISOString(),
                            lastEventCount: 0,
                          }
                        : c
                    ),
                  }
                : m
            ),
          }));
          return 0;
        }

        try {
          const res = await fetch(
            `/api/ics?url=${encodeURIComponent(connection.icsUrl)}`
          );
          if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as {
              error?: string;
            };
            throw new Error(body.error || `Sync failed (${res.status})`);
          }
          const icsText = await res.text();
          // parseIcs expands RRULEs and applies a wide date window
          // (default: 1 year past → 2 years future)
          const parsed = parseIcs(icsText, {
            pastDays: ICS_PAST_DAYS,
            futureDays: ICS_FUTURE_DAYS,
          });
          const provider = connection.provider;

          const imported: CalendarEvent[] = parsed.map((e) => ({
            id: uid("e"),
            title: e.title,
            description: e.description,
            location: e.location,
            memberId,
            start: e.start,
            end: e.end,
            allDay: e.allDay,
            category: "general" as const,
            source: provider,
            externalId: e.uid,
          }));

          update((s) => ({
            ...s,
            events: [
              ...s.events.filter(
                (e) =>
                  !(
                    e.memberId === memberId &&
                    e.source === provider &&
                    e.externalId
                  )
              ),
              ...imported,
            ],
            members: s.members.map((m) =>
              m.id === memberId
                ? {
                    ...m,
                    calendarConnections: m.calendarConnections.map((c) =>
                      c.id === connectionId
                        ? {
                            ...c,
                            status: "connected" as const,
                            lastSyncedAt: new Date().toISOString(),
                            lastEventCount: imported.length,
                            lastError: undefined,
                          }
                        : c
                    ),
                  }
                : m
            ),
          }));

          return imported.length;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Unknown sync error";
          update((s) => ({
            ...s,
            members: s.members.map((m) =>
              m.id === memberId
                ? {
                    ...m,
                    calendarConnections: m.calendarConnections.map((c) =>
                      c.id === connectionId
                        ? {
                            ...c,
                            status: "error" as const,
                            lastError: message,
                          }
                        : c
                    ),
                  }
                : m
            ),
          }));
          throw err;
        }
      },
      resetDemo: () => setState(resetState()),
      getMember: (id) => state.members.find((m) => m.id === id),
    };
  }, [state, hydrated, update]);

  return (
    <FamilyStoreContext.Provider value={value}>
      {children}
    </FamilyStoreContext.Provider>
  );
}

export function useFamilyStore() {
  const ctx = useContext(FamilyStoreContext);
  if (!ctx) throw new Error("useFamilyStore must be used within FamilyStoreProvider");
  return ctx;
}
