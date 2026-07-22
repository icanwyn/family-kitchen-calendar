"use client";

import { useMemo, useState } from "react";
import { useFamilyStore } from "@/context/FamilyStore";
import { Avatar } from "@/components/ui/Avatar";
import type { Chore } from "@/lib/types";
import { choreAssigneeIds } from "@/lib/types";
import { toDateKey } from "@/lib/date-utils";

interface ChoresViewProps {
  onAddChore: () => void;
  onEditChore: (chore: Chore) => void;
}

type Filter = "all" | "today" | "pending" | "done" | "undated";

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
        const ids = choreAssigneeIds(c);
        if (memberFilter !== "all" && !ids.includes(memberFilter)) return false;
        if (filter === "today") {
          // Due today/overdue, plus open undated tasks so they stay visible
          if (c.completed) return !!c.dueDate && c.dueDate <= todayKey;
          if (!c.dueDate) return true;
          return c.dueDate <= todayKey;
        }
        if (filter === "undated") return !c.dueDate && !c.completed;
        if (filter === "pending") return !c.completed;
        if (filter === "done") return c.completed;
        return true;
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        // Undated open tasks after dated ones
        if (!a.dueDate && b.dueDate) return 1;
        if (a.dueDate && !b.dueDate) return -1;
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        return a.title.localeCompare(b.title);
      });
  }, [chores, filter, memberFilter, todayKey]);

  const pointsByMember = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of chores) {
      if (!c.completed) continue;
      const ids = c.completedById
        ? [c.completedById]
        : choreAssigneeIds(c);
      // Split points across assignees if multi
      const share = c.points / Math.max(1, ids.length);
      for (const id of ids) {
        map.set(id, (map.get(id) ?? 0) + share);
      }
    }
    return map;
  }, [chores]);

  const pendingCount = chores.filter((c) => !c.completed).length;
  const doneCount = chores.filter((c) => c.completed).length;
  const undatedCount = chores.filter((c) => !c.dueDate && !c.completed).length;

  return (
    <div className="space-y-6">
      <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Chores & tasks</h2>
          <p className="mt-1 text-slate-600">
            {pendingCount} open · {doneCount} completed
            {undatedCount > 0 ? ` · ${undatedCount} no due date` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onAddChore}
          className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
        >
          + Add chore / task
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {members.map((m) => {
          const pts = Math.round(pointsByMember.get(m.id) ?? 0);
          const open = chores.filter(
            (c) => choreAssigneeIds(c).includes(m.id) && !c.completed
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
                <p className="text-sm text-slate-600">
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
            ["undated", "No due date"],
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
                : "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
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
          <p className="py-12 text-center text-slate-600">
            No chores match this filter.
          </p>
        ) : (
          filtered.map((chore) => {
            const assignees = choreAssigneeIds(chore)
              .map((id) => getMember(id))
              .filter(Boolean);
            const overdue =
              !chore.completed && !!chore.dueDate && chore.dueDate < todayKey;
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
                  <p className="mt-0.5 text-sm text-slate-600">
                    {assignees.length > 0
                      ? assignees.map((m) => m!.name).join(", ")
                      : "Unassigned"}
                    {" · "}
                    <span className="capitalize">{chore.frequency}</span>
                    {" · "}
                    {chore.dueDate ? (
                      <>due {chore.dueDate}</>
                    ) : (
                      <span className="font-semibold text-sky-700">
                        no due date
                      </span>
                    )}
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
