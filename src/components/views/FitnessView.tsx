"use client";

import { useMemo, useState } from "react";
import { useFamilyStore } from "@/context/FamilyStore";
import { Avatar } from "@/components/ui/Avatar";
import {
  ACTIVITY_EMOJIS,
  ACTIVITY_LABELS,
  type FitnessActivityType,
} from "@/lib/types";
import { addDays, toDateKey } from "@/lib/date-utils";

interface FitnessViewProps {
  onAddLog: () => void;
}

export function FitnessView({ onAddLog }: FitnessViewProps) {
  const { fitnessLogs, members, getMember, removeFitnessLog } =
    useFamilyStore();
  const [memberFilter, setMemberFilter] = useState<string | "all">("all");
  const [rangeDays, setRangeDays] = useState<7 | 14 | 30>(7);

  const today = useMemo(() => new Date(), []);
  const todayKey = toDateKey(today);

  const rangeKeys = useMemo(
    () =>
      Array.from({ length: rangeDays }, (_, i) =>
        toDateKey(addDays(today, -(rangeDays - 1 - i)))
      ),
    [today, rangeDays]
  );

  const filteredLogs = useMemo(
    () =>
      fitnessLogs.filter(
        (l) => memberFilter === "all" || l.memberId === memberFilter
      ),
    [fitnessLogs, memberFilter]
  );

  const rangeLogs = useMemo(
    () => filteredLogs.filter((l) => rangeKeys.includes(l.date)),
    [filteredLogs, rangeKeys]
  );

  const totalMinutes = rangeLogs.reduce((s, l) => s + l.durationMinutes, 0);
  const totalSessions = rangeLogs.length;
  const totalMiles = rangeLogs.reduce(
    (s, l) => s + (l.distanceMiles ?? 0),
    0
  );
  const avgMinutes =
    totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

  const dailyMinutes = useMemo(() => {
    return rangeKeys.map((key) => {
      const mins = rangeLogs
        .filter((l) => l.date === key)
        .reduce((s, l) => s + l.durationMinutes, 0);
      return { key, mins };
    });
  }, [rangeKeys, rangeLogs]);

  const maxDay = Math.max(1, ...dailyMinutes.map((d) => d.mins));

  const byActivity = useMemo(() => {
    const map = new Map<FitnessActivityType, number>();
    for (const l of rangeLogs) {
      map.set(l.activityType, (map.get(l.activityType) ?? 0) + l.durationMinutes);
    }
    return [...map.entries()]
      .map(([type, minutes]) => ({ type, minutes }))
      .sort((a, b) => b.minutes - a.minutes);
  }, [rangeLogs]);

  const sortedLogs = useMemo(
    () =>
      [...filteredLogs].sort(
        (a, b) =>
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      ),
    [filteredLogs]
  );

  const canLog = members.length > 0;

  return (
    <div className="space-y-6">
      <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Fitness</h2>
          <p className="mt-1 text-sm font-medium text-slate-700">
            Log activities and track your trends — no program required
          </p>
        </div>
        <button
          type="button"
          onClick={onAddLog}
          disabled={!canLog}
          className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-700/20 transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Log activity
        </button>
      </div>

      {!canLog && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
          Add a family member first (Family tab), then you can log workouts.
        </div>
      )}

      {/* Stats — solid colors for contrast */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={`Minutes (${rangeDays}d)`}
          value={String(totalMinutes)}
          accent="bg-violet-700 text-white"
        />
        <StatCard
          label="Sessions"
          value={String(totalSessions)}
          accent="bg-white text-slate-900 ring-1 ring-slate-300"
        />
        <StatCard
          label="Avg / session"
          value={`${avgMinutes}m`}
          accent="bg-white text-slate-900 ring-1 ring-slate-300"
        />
        <StatCard
          label="Distance"
          value={`${totalMiles.toFixed(1)} mi`}
          accent="bg-white text-slate-900 ring-1 ring-slate-300"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setMemberFilter("all")}
          className={`rounded-full px-4 py-2 text-sm font-bold transition ${
            memberFilter === "all"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-800 ring-1 ring-slate-300"
          }`}
        >
          Everyone
        </button>
        {members.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMemberFilter(m.id)}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold transition ${
              memberFilter === m.id
                ? "bg-white text-slate-900 shadow ring-2"
                : "bg-white text-slate-800 ring-1 ring-slate-300"
            }`}
            style={
              memberFilter === m.id
                ? { ["--tw-ring-color" as string]: m.color }
                : undefined
            }
          >
            <Avatar member={m} size="sm" />
            {m.name}
          </button>
        ))}
        <div className="ml-auto flex gap-1 rounded-full bg-slate-200 p-1">
          {([7, 14, 30] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setRangeDays(d)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                rangeDays === d
                  ? "bg-white text-slate-900 shadow"
                  : "text-slate-700"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Trend chart */}
      <section className="card">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Activity trend</h3>
            <p className="text-sm font-medium text-slate-700">
              Minutes per day · last {rangeDays} days
            </p>
          </div>
          <button
            type="button"
            onClick={onAddLog}
            disabled={!canLog}
            className="text-sm font-bold text-violet-800 hover:underline disabled:opacity-50"
          >
            + Log today
          </button>
        </div>

        <div className="flex h-40 items-end gap-1 sm:gap-1.5">
          {dailyMinutes.map(({ key, mins }) => {
            const heightPct = Math.max(mins > 0 ? 8 : 0, (mins / maxDay) * 100);
            const isToday = key === todayKey;
            const label = key.slice(5); // MM-DD
            return (
              <div
                key={key}
                className="flex min-w-0 flex-1 flex-col items-center gap-1"
                title={`${key}: ${mins} min`}
              >
                <span className="text-[10px] font-bold tabular-nums text-slate-700">
                  {mins > 0 ? mins : ""}
                </span>
                <div className="flex h-28 w-full items-end justify-center">
                  <div
                    className={`w-full max-w-[28px] rounded-t-md transition-all ${
                      isToday ? "bg-violet-700" : "bg-violet-400"
                    } ${mins === 0 ? "min-h-[2px] bg-slate-200" : ""}`}
                    style={{ height: mins === 0 ? 2 : `${heightPct}%` }}
                  />
                </div>
                <span
                  className={`text-[9px] font-bold sm:text-[10px] ${
                    isToday ? "text-violet-800" : "text-slate-600"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {rangeLogs.length === 0 && (
          <p className="mt-4 rounded-xl bg-slate-100 px-4 py-6 text-center text-sm font-semibold text-slate-700">
            No activity in this range yet.{" "}
            <button
              type="button"
              onClick={onAddLog}
              disabled={!canLog}
              className="text-violet-800 underline disabled:no-underline"
            >
              Log your first workout
            </button>
          </p>
        )}
      </section>

      {/* By activity type */}
      <section className="card">
        <h3 className="mb-4 text-lg font-bold text-slate-900">
          By activity type
        </h3>
        {byActivity.length === 0 ? (
          <p className="text-sm font-medium text-slate-600">
            Log runs, walks, strength, and more to see a breakdown here.
          </p>
        ) : (
          <ul className="space-y-3">
            {byActivity.map(({ type, minutes }) => {
              const pct = Math.round((minutes / Math.max(1, totalMinutes)) * 100);
              return (
                <li key={type}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-900">
                      {ACTIVITY_EMOJIS[type]} {ACTIVITY_LABELS[type]}
                    </span>
                    <span className="font-bold tabular-nums text-slate-800">
                      {minutes} min · {pct}%
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-violet-600 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Quick activity shortcuts */}
      <section className="card">
        <h3 className="mb-3 text-lg font-bold text-slate-900">
          Quick log
        </h3>
        <p className="mb-3 text-sm font-medium text-slate-700">
          Open the full form, or pick a type and fill details next.
        </p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ACTIVITY_LABELS) as FitnessActivityType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={onAddLog}
              disabled={!canLog}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-900 ring-1 ring-slate-300 transition hover:bg-violet-50 hover:ring-violet-400 disabled:opacity-50"
            >
              <span>{ACTIVITY_EMOJIS[t]}</span>
              {ACTIVITY_LABELS[t]}
            </button>
          ))}
        </div>
      </section>

      {/* History */}
      <section className="card">
        <h3 className="mb-4 text-lg font-bold text-slate-900">
          Activity history
        </h3>
        {sortedLogs.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 py-10 text-center">
            <p className="font-semibold text-slate-800">No workouts logged yet</p>
            <button
              type="button"
              onClick={onAddLog}
              disabled={!canLog}
              className="mt-3 rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              Log activity
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {sortedLogs.slice(0, 40).map((log) => {
              const member = getMember(log.memberId);
              return (
                <li
                  key={log.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-xl">
                    {ACTIVITY_EMOJIS[log.activityType]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900">{log.title}</p>
                    <p className="text-sm font-medium text-slate-700">
                      {member?.name ?? "Unknown"} · {log.date} ·{" "}
                      {log.durationMinutes} min
                      {log.distanceMiles
                        ? ` · ${log.distanceMiles} mi`
                        : ""}
                      {log.calories ? ` · ${log.calories} cal` : ""}
                    </p>
                    {log.notes && (
                      <p className="mt-0.5 text-sm text-slate-600">{log.notes}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFitnessLog(log.id)}
                    className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className={`rounded-2xl px-4 py-4 shadow-sm ${accent}`}>
      <p
        className={`text-xs font-bold uppercase tracking-wide ${
          accent.includes("text-white") ? "text-violet-100" : "text-slate-600"
        }`}
      >
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
