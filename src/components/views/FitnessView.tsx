"use client";

import { useMemo, useState } from "react";
import { useFamilyStore } from "@/context/FamilyStore";
import { Avatar } from "@/components/ui/Avatar";
import {
  ACTIVITY_EMOJIS,
  ACTIVITY_LABELS,
  type FitnessActivityType,
  type WorkoutProgram,
  type WorkoutProgramDay,
} from "@/lib/types";
import { addDays, toDateKey } from "@/lib/date-utils";
import { findDay, getWeekIndexForDate, todayISO } from "@/lib/fitness/programGenerator.js";

interface FitnessViewProps {
  onAddLog: () => void;
  onCreateProgram: () => void;
  onLogSession: (args: {
    memberId: string;
    programId: string;
    day: WorkoutProgramDay;
  }) => void;
}

type Tab = "activities" | "programs";

export function FitnessView({
  onAddLog,
  onCreateProgram,
  onLogSession,
}: FitnessViewProps) {
  const {
    fitnessLogs,
    workoutPrograms = [],
    members,
    getMember,
    removeFitnessLog,
    removeWorkoutProgram,
    setActiveWorkoutProgram,
  } = useFamilyStore();

  const [tab, setTab] = useState<Tab>("activities");
  const [memberFilter, setMemberFilter] = useState<string | "all">("all");
  const [rangeDays, setRangeDays] = useState<7 | 14 | 30>(7);
  const [viewProgramId, setViewProgramId] = useState<string | null>(null);
  const [weekIdx, setWeekIdx] = useState(0);

  const today = useMemo(() => new Date(), []);
  const todayKey = todayISO();

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

  const activityLogs = useMemo(
    () =>
      filteredLogs.filter(
        (l) => l.source !== "program" || !l.sessionDayId
      ),
    [filteredLogs]
  );

  const rangeLogs = useMemo(
    () => filteredLogs.filter((l) => rangeKeys.includes(l.date)),
    [filteredLogs, rangeKeys]
  );

  const totalMinutes = rangeLogs.reduce((s, l) => s + l.durationMinutes, 0);
  const totalSessions = rangeLogs.length;
  const totalSteps = rangeLogs.reduce((s, l) => s + (l.steps ?? 0), 0);
  const totalMiles = rangeLogs.reduce((s, l) => s + (l.distanceMiles ?? 0), 0);

  const dailyMinutes = useMemo(
    () =>
      rangeKeys.map((key) => ({
        key,
        mins: rangeLogs
          .filter((l) => l.date === key)
          .reduce((s, l) => s + l.durationMinutes, 0),
      })),
    [rangeKeys, rangeLogs]
  );
  const maxDay = Math.max(1, ...dailyMinutes.map((d) => d.mins));

  const byActivity = useMemo(() => {
    const map = new Map<FitnessActivityType, number>();
    for (const l of rangeLogs) {
      map.set(
        l.activityType,
        (map.get(l.activityType) ?? 0) + Math.max(l.durationMinutes, 0)
      );
    }
    return [...map.entries()]
      .map(([type, minutes]) => ({ type, minutes }))
      .sort((a, b) => b.minutes - a.minutes);
  }, [rangeLogs]);

  const sortedLogs = useMemo(
    () =>
      [...filteredLogs].sort(
        (a, b) =>
          new Date(b.completedAt).getTime() -
          new Date(a.completedAt).getTime()
      ),
    [filteredLogs]
  );

  const programs = useMemo(
    () =>
      workoutPrograms.filter(
        (p) => memberFilter === "all" || p.memberId === memberFilter
      ),
    [workoutPrograms, memberFilter]
  );

  const viewProgram =
    programs.find((p) => p.id === viewProgramId) ||
    programs.find((p) => p.active) ||
    programs[0] ||
    null;

  const canLog = members.length > 0;

  return (
    <div className="space-y-5">
      <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Fitness</h2>
          <p className="mt-1 text-sm font-medium text-slate-700">
            Log free activities or follow a Mori-style 4-week training program
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onAddLog}
            disabled={!canLog}
            className="rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            Log activity
          </button>
          <button
            type="button"
            onClick={onCreateProgram}
            disabled={!canLog}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            Create program
          </button>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 rounded-2xl bg-slate-200 p-1">
        <TabBtn
          active={tab === "activities"}
          onClick={() => setTab("activities")}
          label="Activities"
          sub="Walk, sports, steps…"
        />
        <TabBtn
          active={tab === "programs"}
          onClick={() => setTab("programs")}
          label="Programs"
          sub="4-week training plans"
        />
      </div>

      {/* Member filter */}
      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={memberFilter === "all"}
          onClick={() => setMemberFilter("all")}
          label="Everyone"
        />
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
      </div>

      {tab === "activities" && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={`Minutes (${rangeDays}d)`}
              value={String(totalMinutes)}
              solid
            />
            <StatCard label="Sessions" value={String(totalSessions)} />
            <StatCard
              label="Distance"
              value={`${totalMiles.toFixed(1)} mi`}
            />
            <StatCard
              label="Steps"
              value={totalSteps > 0 ? totalSteps.toLocaleString() : "—"}
            />
          </div>

          <div className="flex justify-end">
            <div className="flex gap-1 rounded-full bg-slate-200 p-1">
              {([7, 14, 30] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setRangeDays(d)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
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

          <section className="card">
            <h3 className="mb-1 text-lg font-bold text-slate-900">
              Activity trend
            </h3>
            <p className="mb-4 text-sm font-medium text-slate-700">
              Minutes per day
            </p>
            <div className="flex h-40 items-end gap-1 sm:gap-1.5">
              {dailyMinutes.map(({ key, mins }) => {
                const heightPct = Math.max(
                  mins > 0 ? 8 : 0,
                  (mins / maxDay) * 100
                );
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
                        className={`w-full max-w-[28px] rounded-t-md ${
                          key === todayKey ? "bg-violet-700" : "bg-violet-400"
                        } ${mins === 0 ? "bg-slate-200" : ""}`}
                        style={{
                          height: mins === 0 ? 2 : `${heightPct}%`,
                        }}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-slate-600 sm:text-[10px]">
                      {key.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="card">
            <h3 className="mb-3 text-lg font-bold text-slate-900">
              Quick log
            </h3>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(ACTIVITY_LABELS) as FitnessActivityType[]).map(
                (t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={onAddLog}
                    disabled={!canLog}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-900 ring-1 ring-slate-300 hover:bg-violet-50 disabled:opacity-50"
                  >
                    {ACTIVITY_EMOJIS[t]} {ACTIVITY_LABELS[t]}
                  </button>
                )
              )}
            </div>
          </section>

          {byActivity.length > 0 && (
            <section className="card">
              <h3 className="mb-4 text-lg font-bold text-slate-900">
                By activity type
              </h3>
              <ul className="space-y-3">
                {byActivity.map(({ type, minutes }) => {
                  const pct = Math.round(
                    (minutes / Math.max(1, totalMinutes)) * 100
                  );
                  return (
                    <li key={type}>
                      <div className="mb-1 flex justify-between text-sm font-bold text-slate-900">
                        <span>
                          {ACTIVITY_EMOJIS[type]} {ACTIVITY_LABELS[type]}
                        </span>
                        <span>
                          {minutes} min · {pct}%
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-violet-600"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <HistoryList
            logs={sortedLogs}
            getMember={getMember}
            onRemove={removeFitnessLog}
            emptyAction={onAddLog}
            canLog={canLog}
          />
        </>
      )}

      {tab === "programs" && (
        <>
          {programs.length === 0 ? (
            <div className="card border-dashed py-12 text-center">
              <p className="text-lg font-bold text-slate-900">
                No training programs yet
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm font-medium text-slate-700">
                Build a personalized 4-week plan (like{" "}
                <a
                  href="https://mori-workout.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-violet-800 underline"
                >
                  Mori
                </a>
                ): goals, equipment, experience → weekly calendar with sets,
                reps, and rest.
              </p>
              <button
                type="button"
                onClick={onCreateProgram}
                disabled={!canLog}
                className="mt-5 rounded-xl bg-violet-700 px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                Create your first program
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {programs.map((p) => {
                  const m = getMember(p.memberId);
                  const selected = viewProgram?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setViewProgramId(p.id);
                        setWeekIdx(
                          getWeekIndexForDate(p, todayKey) || 0
                        );
                      }}
                      className={`rounded-2xl border px-3 py-2 text-left transition ${
                        selected
                          ? "border-violet-600 bg-violet-50 ring-2 ring-violet-400"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      <p className="text-sm font-bold text-slate-900">
                        {p.name || p.primaryGoalLabel}
                        {p.active && (
                          <span className="ml-2 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                            Active
                          </span>
                        )}
                      </p>
                      <p className="text-xs font-medium text-slate-600">
                        {m?.name} · {p.rtDaysPerWeek} days/wk ·{" "}
                        {p.primaryGoalLabel}
                      </p>
                    </button>
                  );
                })}
              </div>

              {viewProgram && (
                <ProgramDetail
                  program={viewProgram}
                  weekIdx={weekIdx}
                  setWeekIdx={setWeekIdx}
                  todayKey={todayKey}
                  getMember={getMember}
                  logs={fitnessLogs}
                  onActivate={() =>
                    setActiveWorkoutProgram(
                      viewProgram.id,
                      viewProgram.memberId
                    )
                  }
                  onDelete={() => {
                    if (confirm("Delete this training program?")) {
                      removeWorkoutProgram(viewProgram.id);
                      setViewProgramId(null);
                    }
                  }}
                  onLogDay={(day) =>
                    onLogSession({
                      memberId: viewProgram.memberId,
                      programId: viewProgram.id,
                      day,
                    })
                  }
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function ProgramDetail({
  program,
  weekIdx,
  setWeekIdx,
  todayKey,
  getMember,
  logs,
  onActivate,
  onDelete,
  onLogDay,
}: {
  program: WorkoutProgram;
  weekIdx: number;
  setWeekIdx: (n: number) => void;
  todayKey: string;
  getMember: (id: string) => { name: string } | undefined;
  logs: { programId?: string; sessionDayId?: string }[];
  onActivate: () => void;
  onDelete: () => void;
  onLogDay: (day: WorkoutProgramDay) => void;
}) {
  const week = program.weeks[weekIdx] || program.weeks[0];
  const member = getMember(program.memberId);
  const foundToday = findDay(program, todayKey);

  const completedIds = new Set(
    logs
      .filter(
        (l) => l.programId === program.id && l.sessionDayId
      )
      .map((l) => l.sessionDayId)
  );

  const weekDone = week.days.filter(
    (d) => d.type !== "rest" && completedIds.has(d.id)
  ).length;
  const weekWork = week.days.filter((d) => d.type !== "rest").length;

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {program.name || program.primaryGoalLabel}
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-700">
              {member?.name} · {program.primaryGoalLabel} ·{" "}
              {program.split.replace(/_/g, " ")} · {program.rtDaysPerWeek}{" "}
              RT days/week
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {program.progressionNotes}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!program.active && (
              <button
                type="button"
                onClick={onActivate}
                className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white"
              >
                Set active
              </button>
            )}
            <button
              type="button"
              onClick={onDelete}
              className="rounded-xl bg-slate-200 px-3 py-2 text-xs font-bold text-slate-800"
            >
              Delete
            </button>
          </div>
        </div>

        {foundToday?.day && foundToday.day.type !== "rest" && (
          <button
            type="button"
            onClick={() => onLogDay(foundToday.day)}
            className="mt-4 w-full rounded-xl bg-violet-700 px-4 py-3 text-sm font-bold text-white sm:w-auto"
          >
            {completedIds.has(foundToday.day.id)
              ? "Log again · "
              : "Start today’s session · "}
            {foundToday.day.title}
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={weekIdx <= 0}
          onClick={() => setWeekIdx(weekIdx - 1)}
          className="nav-btn disabled:opacity-40"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-slate-900">
            Week {week.week}
            {week.deload ? " · Deload" : ""}
          </p>
          <p className="text-xs font-medium text-slate-600">
            {weekDone}/{weekWork} sessions logged · starts {week.startDate}
          </p>
        </div>
        <button
          type="button"
          disabled={weekIdx >= program.weeks.length - 1}
          onClick={() => setWeekIdx(weekIdx + 1)}
          className="nav-btn disabled:opacity-40"
        >
          ›
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-7">
        {week.days.map((day) => {
          const done = completedIds.has(day.id);
          const isToday = day.date === todayKey;
          const isRest = day.type === "rest";
          return (
            <button
              key={day.id}
              type="button"
              disabled={isRest}
              onClick={() => !isRest && onLogDay(day)}
              className={`rounded-2xl border p-3 text-left transition ${
                isToday
                  ? "border-violet-600 ring-2 ring-violet-400"
                  : "border-slate-300"
              } ${
                isRest
                  ? "bg-slate-50 opacity-80"
                  : done
                    ? "bg-emerald-50"
                    : "bg-white hover:border-violet-400"
              }`}
            >
              <p className="text-[10px] font-bold uppercase text-slate-600">
                {day.dayName}
              </p>
              <p className="text-sm font-bold text-slate-900">
                {day.date.slice(8)}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-800">
                {day.title}
              </p>
              {!isRest && (
                <p className="mt-1 text-[10px] font-medium text-slate-600">
                  {day.exercises.length} exercises · ~{day.estimatedMinutes}m
                  {done ? " · ✓" : ""}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected week exercise preview for first RT day */}
      {week.days
        .filter((d) => d.type === "rt")
        .slice(0, 1)
        .map((day) => (
          <div key={day.id + "-preview"} className="card">
            <h4 className="font-bold text-slate-900">
              Sample session: {day.title}
            </h4>
            <ul className="mt-3 divide-y divide-slate-200">
              {day.exercises.map((ex, i) => (
                <li
                  key={ex.exerciseId + i}
                  className="flex justify-between gap-2 py-2 text-sm"
                >
                  <span className="font-semibold text-slate-900">
                    {ex.name}
                  </span>
                  <span className="shrink-0 font-medium text-slate-700">
                    {ex.sets}×{ex.repsLabel}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
    </div>
  );
}

function HistoryList({
  logs,
  getMember,
  onRemove,
  emptyAction,
  canLog,
}: {
  logs: ReturnType<typeof useFamilyStore>["fitnessLogs"];
  getMember: ReturnType<typeof useFamilyStore>["getMember"];
  onRemove: (id: string) => void;
  emptyAction: () => void;
  canLog: boolean;
}) {
  return (
    <section className="card">
      <h3 className="mb-4 text-lg font-bold text-slate-900">History</h3>
      {logs.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 py-10 text-center">
          <p className="font-semibold text-slate-800">Nothing logged yet</p>
          <button
            type="button"
            onClick={emptyAction}
            disabled={!canLog}
            className="mt-3 rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            Log activity
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-slate-200">
          {logs.slice(0, 40).map((log) => {
            const member = getMember(log.memberId);
            return (
              <li
                key={log.id}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-xl">
                  {ACTIVITY_EMOJIS[log.activityType] || "🏋️"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900">
                    {log.title}
                    {log.source === "program" && (
                      <span className="ml-2 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                        Program
                      </span>
                    )}
                  </p>
                  <p className="text-sm font-medium text-slate-700">
                    {member?.name ?? "—"} · {log.date}
                    {log.durationMinutes
                      ? ` · ${log.durationMinutes} min`
                      : ""}
                    {log.distanceMiles
                      ? ` · ${log.distanceMiles} mi`
                      : ""}
                    {log.steps ? ` · ${log.steps.toLocaleString()} steps` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(log.id)}
                  className="text-xs font-bold text-slate-600 hover:text-rose-700"
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function TabBtn({
  active,
  onClick,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-xl px-3 py-2.5 text-left transition ${
        active
          ? "bg-white text-slate-900 shadow"
          : "text-slate-700 hover:bg-white/50"
      }`}
    >
      <span className="block text-sm font-bold">{label}</span>
      <span className="block text-[11px] font-medium opacity-80">{sub}</span>
    </button>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-bold ${
        active
          ? "bg-slate-900 text-white"
          : "bg-white text-slate-800 ring-1 ring-slate-300"
      }`}
    >
      {label}
    </button>
  );
}

function StatCard({
  label,
  value,
  solid,
}: {
  label: string;
  value: string;
  solid?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl px-4 py-4 shadow-sm ${
        solid
          ? "bg-violet-700 text-white"
          : "bg-white text-slate-900 ring-1 ring-slate-300"
      }`}
    >
      <p
        className={`text-xs font-bold uppercase tracking-wide ${
          solid ? "text-violet-100" : "text-slate-600"
        }`}
      >
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
