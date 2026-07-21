"use client";

import { useMemo, useState } from "react";
import { useFamilyStore } from "@/context/FamilyStore";
import { Avatar } from "@/components/ui/Avatar";
import type { Chore } from "@/lib/types";
import { toDateKey } from "@/lib/date-utils";

interface ChoresViewProps {
  onAddChore: () => void;
  onEditChore: (chore: Chore) => void;
}

type Filter = "all" | "today" | "pending" | "done";

export function ChoresView({ onAddChore, onEditChore }: ChoresViewProps) {
  const {
    chores,
    members,
    getMember,
    toggleChore,
    activeMemberId,
  } = useFamilyStore();
  const [filter, setFilter] = useState<Filter>("today");
  const [memberFilter, setMemberFilter] = useState<string | "all">("all");

  const todayKey = toDateKey(new Date());

  const filtered = useMemo(() => {
    return chores
      .filter((c) => {
        if (memberFilter !== "all" && c.assigneeId !== memberFilter) return false;
        if (filter === "today") return c.dueDate <= todayKey || c.completed;
        if (filter === "pending") return !c.completed;
        if (filter === "done") return c.completed;
        return true;
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
  }, [chores, filter, memberFilter, todayKey]);

  const pointsByMember = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of chores) {
      if (!c.completed) continue;
      const id = c.completedById ?? c.assigneeId;
      map.set(id, (map.get(id) ?? 0) + c.points);
    }
    return map;
  }, [chores]);

  const pendingCount = chores.filter((c) => !c.completed).length;
  const doneCount = chores.filter((c) => c.completed).length;

  return (
    <div className="space-y-6">
      <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Chores & tasks</h2>
          <p className="mt-1 text-slate-500">
            {pendingCount} open · {doneCount} completed
          </p>
        </div>
        <button
          type="button"
          onClick={onAddChore}
          className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
        >
          + Add chore
        </button>
      </div>

      {/* Leaderboard */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {members.map((m) => {
          const pts = pointsByMember.get(m.id) ?? 0;
          const open = chores.filter(
            (c) => c.assigneeId === m.id && !c.completed
          ).length;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() =>
                setMemberFilter((prev) => (prev === m.id ? "all" : m.id))
              }
              className={`card flex items-center gap-3 text-left transition ${
                memberFilter === m.id
                  ? "ring-2 ring-emerald-400"
                  : "hover:border-emerald-200"
              }`}
            >
              <Avatar member={m} size="lg" />
              <div>
                <p className="font-semibold text-slate-900">{m.name}</p>
                <p className="text-sm text-slate-500">
                  <span className="font-semibold text-amber-600">{pts}</span>{" "}
                  pts · {open} open
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["today", "Due today"],
            ["pending", "Pending"],
            ["done", "Done"],
            ["all", "All"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              filter === id
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
        {memberFilter !== "all" && (
          <button
            type="button"
            onClick={() => setMemberFilter("all")}
            className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"
          >
            Clear member filter
          </button>
        )}
      </div>

      <div className="card space-y-2 p-3 sm:p-4">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-slate-500">
            No chores match this filter.
          </p>
        ) : (
          filtered.map((chore) => {
            const member = getMember(chore.assigneeId);
            const overdue =
              !chore.completed && chore.dueDate < todayKey;
            return (
              <div
                key={chore.id}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-3 transition sm:px-4 ${
                  chore.completed
                    ? "border-transparent bg-slate-50 opacity-70"
                    : overdue
                      ? "border-rose-100 bg-rose-50/50"
                      : "border-slate-100 bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    toggleChore(chore.id, activeMemberId ?? undefined)
                  }
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 text-sm font-bold transition ${
                    chore.completed
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-300 text-transparent hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-500"
                  }`}
                  aria-label={
                    chore.completed ? "Mark incomplete" : "Mark complete"
                  }
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => onEditChore(chore)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p
                    className={`font-semibold ${
                      chore.completed
                        ? "text-slate-400 line-through"
                        : "text-slate-900"
                    }`}
                  >
                    {chore.title}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {member && (
                      <span>
                        {member.avatarEmoji} {member.name}
                      </span>
                    )}
                    {" · "}
                    <span className="capitalize">{chore.frequency}</span>
                    {" · due "}
                    {chore.dueDate}
                    {overdue && (
                      <span className="ml-1 font-medium text-rose-500">
                        overdue
                      </span>
                    )}
                  </p>
                </button>
                <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                  +{chore.points}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
