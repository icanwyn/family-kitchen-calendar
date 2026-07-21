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
} from "@/lib/types";
import { loadState, resetState, saveState } from "@/lib/storage";
import { uid } from "@/lib/date-utils";
import { parseIcs } from "@/lib/ics";

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
}

const FamilyStoreContext = createContext<FamilyStoreValue | null>(null);

export function FamilyStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => structuredClone(loadState()));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  const update = useCallback((fn: (prev: AppState) => AppState) => {
    setState((prev) => fn(prev));
  }, []);

  const value = useMemo<FamilyStoreValue>(() => {
    return {
      ...state,
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
          chores: s.chores.filter((c) => c.assigneeId !== id),
          fitnessLogs: s.fitnessLogs.filter((f) => f.memberId !== id),
          fitnessPrograms: s.fitnessPrograms.filter((p) => p.memberId !== id),
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
        update((s) => ({
          ...s,
          chores: [...s.chores, { ...chore, id: uid("ch"), completed: false }],
        })),
      updateChore: (id, patch) =>
        update((s) => ({
          ...s,
          chores: s.chores.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      toggleChore: (id, completedById) =>
        update((s) => ({
          ...s,
          chores: s.chores.map((c) => {
            if (c.id !== id) return c;
            if (c.completed) {
              return {
                ...c,
                completed: false,
                completedAt: undefined,
                completedById: undefined,
              };
            }
            return {
              ...c,
              completed: true,
              completedAt: new Date().toISOString(),
              completedById: completedById ?? s.activeMemberId ?? c.assigneeId,
            };
          }),
        })),
      removeChore: (id) =>
        update((s) => ({
          ...s,
          chores: s.chores.filter((c) => c.id !== id),
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
          const parsed = parseIcs(icsText);
          const provider = connection.provider;

          // Keep events from the last ~90 days into the future ~180 days
          const now = Date.now();
          const minT = now - 90 * 24 * 60 * 60 * 1000;
          const maxT = now + 180 * 24 * 60 * 60 * 1000;
          const imported: CalendarEvent[] = parsed
            .filter((e) => {
              const t = new Date(e.start).getTime();
              return t >= minT && t <= maxT;
            })
            .map((e) => ({
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
