"use client";

import { useState } from "react";
import { useFamilyStore } from "@/context/FamilyStore";
import { Avatar } from "@/components/ui/Avatar";
import type { FamilyMember } from "@/lib/types";
import { inputClass } from "@/components/ui/Modal";

interface FamilyViewProps {
  onAddMember: () => void;
  onEditMember: (member: FamilyMember) => void;
  onConnect: (
    member: FamilyMember,
    provider: "google" | "outlook"
  ) => void;
}

export function FamilyView({
  onAddMember,
  onEditMember,
  onConnect,
}: FamilyViewProps) {
  const {
    members,
    familyName,
    setFamilyName,
    setActiveMember,
    activeMemberId,
    disconnectCalendar,
    syncCalendar,
    resetDemo,
    events,
    chores,
    fitnessLogs,
  } = useFamilyStore();

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(familyName);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleSync = async (memberId: string, connectionId: string) => {
    setSyncingId(connectionId);
    setSyncMessage(null);
    try {
      const count = await syncCalendar(memberId, connectionId);
      setSyncMessage(
        count > 0
          ? `Imported ${count} event${count === 1 ? "" : "s"}`
          : "Sync complete (no new events in range)"
      );
    } catch (err) {
      setSyncMessage(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncingId(null);
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          {editingName ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                className={`${inputClass} max-w-md`}
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  if (nameDraft.trim()) setFamilyName(nameDraft.trim());
                  setEditingName(false);
                }}
                className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setNameDraft(familyName);
                  setEditingName(false);
                }}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setNameDraft(familyName);
                setEditingName(true);
              }}
              className="text-left"
            >
              <h2 className="text-2xl font-bold text-slate-900">
                {familyName}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Tap to rename · {members.length} members · click a card to edit
              </p>
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onAddMember}
          className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700"
        >
          + Add member
        </button>
      </div>

      {syncMessage && (
        <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-900">
          {syncMessage}
        </div>
      )}

      {/* Connect help */}
      <div className="card border-sky-100 bg-gradient-to-br from-sky-50 to-white">
        <h3 className="font-semibold text-slate-900">
          Connect Google or Outlook
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Each person can link their calendar with a secret <strong>ICS /
          iCal</strong> feed URL (no Google login password needed in this app).
          Open a member card → <strong>Google</strong> or{" "}
          <strong>Outlook</strong> → follow the in-app steps to copy the link
          from calendar settings, then paste and import.
        </p>
      </div>

      {members.length === 0 && (
        <div className="card border-dashed py-12 text-center">
          <p className="text-lg font-semibold text-slate-800">No members yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Add everyone in the family, then assign chores and calendars.
          </p>
          <button
            type="button"
            onClick={onAddMember}
            className="mt-4 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white"
          >
            + Add family member
          </button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {members.map((member) => {
          const eventCount = events.filter(
            (e) => e.memberId === member.id
          ).length;
          const choreOpen = chores.filter(
            (c) => c.assigneeId === member.id && !c.completed
          ).length;
          const fitCount = fitnessLogs.filter(
            (f) => f.memberId === member.id
          ).length;
          const isActive = activeMemberId === member.id;

          return (
            <div
              key={member.id}
              className={`card ${
                isActive ? "ring-2 ring-sky-400" : ""
              }`}
              style={{ borderLeft: `5px solid ${member.color}` }}
            >
              <div className="flex items-start gap-4">
                <button
                  type="button"
                  onClick={() => onEditMember(member)}
                  className="shrink-0 rounded-full transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
                  title={`Edit ${member.name}`}
                >
                  <Avatar member={member} size="xl" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEditMember(member)}
                      className="text-left text-xl font-bold text-slate-900 hover:text-sky-700"
                    >
                      {member.name}
                    </button>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-500">
                      {member.role}
                    </span>
                    {isActive && (
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                        Active user
                      </span>
                    )}
                  </div>
                  {member.email && (
                    <p className="mt-0.5 truncate text-sm text-slate-400">
                      {member.email}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-slate-500">
                    {eventCount} events · {choreOpen} open chores · {fitCount}{" "}
                    workouts
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onEditMember(member)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
                    >
                      <span aria-hidden>✏️</span>
                      Edit profile
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMember(member.id)}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                    >
                      Switch to
                    </button>
                  </div>
                </div>
              </div>

              {/* Calendar connections */}
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Connected calendars
                </p>
                {member.calendarConnections.length === 0 ? (
                  <p className="mb-3 text-sm text-slate-500">
                    No external calendars yet. Connect Google or Outlook below.
                  </p>
                ) : (
                  <ul className="mb-3 space-y-2">
                    {member.calendarConnections.map((c) => (
                      <li
                        key={c.id}
                        className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-2"
                      >
                        <ProviderIcon provider={c.provider} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium capitalize text-slate-800">
                            {c.provider}
                            <span
                              className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                                c.status === "connected"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : c.status === "syncing"
                                    ? "bg-amber-100 text-amber-700"
                                    : c.status === "error"
                                      ? "bg-rose-100 text-rose-700"
                                      : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {syncingId === c.id ? "syncing" : c.status}
                            </span>
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {c.accountEmail}
                            {c.icsUrl ? " · ICS feed" : " · demo link"}
                            {typeof c.lastEventCount === "number" &&
                              ` · ${c.lastEventCount} events`}
                            {c.lastSyncedAt &&
                              ` · synced ${new Date(c.lastSyncedAt).toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}`}
                          </p>
                          {c.lastError && (
                            <p className="mt-0.5 text-xs text-rose-600">
                              {c.lastError}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSync(member.id, c.id)}
                          disabled={syncingId === c.id || c.status === "syncing"}
                          className="rounded-lg px-2 py-1 text-xs font-semibold text-sky-600 hover:bg-sky-50 disabled:opacity-50"
                        >
                          {syncingId === c.id ? "…" : "Sync"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              confirm(
                                `Disconnect ${c.provider} for ${member.name}? Imported events from this calendar will be removed.`
                              )
                            ) {
                              disconnectCalendar(member.id, c.id);
                            }
                          }}
                          className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-50"
                        >
                          Disconnect
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onConnect(member, "google")}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50"
                  >
                    <ProviderIcon provider="google" />
                    Google
                  </button>
                  <button
                    type="button"
                    onClick={() => onConnect(member, "outlook")}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50"
                  >
                    <ProviderIcon provider="outlook" />
                    Outlook
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card border-dashed">
        <h3 className="font-semibold text-slate-900">Clear local data</h3>
        <p className="mt-1 text-sm text-slate-500">
          Family data for this browser is stored locally. Clearing resets
          members, events, chores, and fitness to empty.
        </p>
        <button
          type="button"
          onClick={() => {
            if (
              confirm(
                "Clear all local calendar data on this device? This cannot be undone."
              )
            ) {
              resetDemo();
            }
          }}
          className="mt-3 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
        >
          Clear all data
        </button>
      </div>
    </div>
  );
}

function ProviderIcon({ provider }: { provider: string }) {
  if (provider === "google") {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-sm font-bold text-red-500 shadow-sm ring-1 ring-slate-200">
        G
      </span>
    );
  }
  if (provider === "outlook") {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-600 text-xs font-bold text-white shadow-sm">
        O
      </span>
    );
  }
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200 text-xs font-bold text-slate-600">
      ·
    </span>
  );
}
