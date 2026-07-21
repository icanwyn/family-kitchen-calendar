"use client";

import { useMemo, useState } from "react";
import { useFamilyStore } from "@/context/FamilyStore";
import { Avatar } from "@/components/ui/Avatar";
import type { FitnessProgram } from "@/lib/types";
import { ACTIVITY_EMOJIS, ACTIVITY_LABELS } from "@/lib/types";
import { addDays, startOfWeek, toDateKey } from "@/lib/date-utils";

interface FitnessViewProps {
  onAddLog: () => void;
  onAddProgram: () => void;
  onEditProgram: (program: FitnessProgram) => void;
}

export function FitnessView({
  onAddLog,
  onAddProgram,
  onEditProgram,
}: FitnessViewProps) {
  const {
    fitnessLogs,
    fitnessPrograms,
    members,
    getMember,
    removeFitnessLog,
  } = useFamilyStore();
  const [memberFilter, setMemberFilter] = useState<string | "all">("all");

  const weekStart = startOfWeek(new Date());
  const weekKeys = useMemo(
    () => Array.from({ length: 7 }, (_, i) => toDateKey(addDays(weekStart, i))),
    [weekStart]
  );

  const weekLogs = useMemo(
    () =>
      fitnessLogs.filter(
        (l) =>
          weekKeys.includes(l.date) &&
          (memberFilter === "all" || l.memberId === memberFilter)
      ),
    [fitnessLogs, weekKeys, memberFilter]
  );

  const totalMinutes = weekLogs.reduce((s, l) => s + l.durationMinutes, 0);
  const totalSessions = weekLogs.length;

  const sortedLogs = useMemo(
    () =>
      [...fitnessLogs]
        .filter(
          (l) => memberFilter === "all" || l.memberId === memberFilter
        )
        .sort(
          (a, b) =>
            new Date(b.completedAt).getTime() -
            new Date(a.completedAt).getTime()
        ),
    [fitnessLogs, memberFilter]
  );

  const programs = fitnessPrograms.filter(
    (p) =>
      p.active && (memberFilter === "all" || p.memberId === memberFilter)
  );

  return (
    <div className="space-y-6">
      <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Fitness & exercise
          </h2>
          <p className="mt-1 text-slate-500">
            Log workouts and track family programs
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onAddProgram}
            className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            + Program
          </button>
          <button
            type="button"
            onClick={onAddLog}
            className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700"
          >
            + Log workout
          </button>
        </div>
      </div>

      {/* Week stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card bg-gradient-to-br from-violet-600 to-indigo-700 text-white">
          <p className="text-sm font-medium text-violet-100">This week</p>
          <p className="mt-1 text-4xl font-bold tabular-nums">{totalMinutes}</p>
          <p className="text-sm text-violet-100">minutes active</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-slate-500">Sessions</p>
          <p className="mt-1 text-4xl font-bold tabular-nums text-slate-900">
            {totalSessions}
          </p>
          <p className="text-sm text-slate-500">logged this week</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-slate-500">Active programs</p>
          <p className="mt-1 text-4xl font-bold tabular-nums text-slate-900">
            {programs.length}
          </p>
          <p className="text-sm text-slate-500">across the family</p>
        </div>
      </div>

      {/* Member filter */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMemberFilter("all")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            memberFilter === "all"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 ring-1 ring-slate-200"
          }`}
        >
          Everyone
        </button>
        {members.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMemberFilter(m.id)}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${
              memberFilter === m.id
                ? "bg-white text-slate-900 shadow ring-2"
                : "bg-white text-slate-600 ring-1 ring-slate-200"
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

      {/* Programs */}
      <section>
        <h3 className="mb-3 text-lg font-semibold text-slate-900">
          Programs
        </h3>
        {programs.length === 0 ? (
          <div className="card border-dashed text-center">
            <p className="text-slate-500">No active programs yet.</p>
            <button
              type="button"
              onClick={onAddProgram}
              className="mt-2 text-sm font-semibold text-violet-600"
            >
              Create a program
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {programs.map((program) => {
              const member = getMember(program.memberId);
              const logs = weekLogs.filter(
                (l) =>
                  l.memberId === program.memberId &&
                  (l.programId === program.id ||
                    program.activityTypes.includes(l.activityType))
              );
              const sessions = logs.length;
              const minutes = logs.reduce(
                (s, l) => s + l.durationMinutes,
                0
              );
              const sessionPct = Math.min(
                100,
                Math.round(
                  (sessions / Math.max(1, program.weeklyGoalSessions)) * 100
                )
              );
              const minutePct = Math.min(
                100,
                Math.round(
                  (minutes / Math.max(1, program.weeklyGoalMinutes)) * 100
                )
              );

              return (
                <button
                  key={program.id}
                  type="button"
                  onClick={() => onEditProgram(program)}
                  className="card text-left transition hover:shadow-md"
                  style={{
                    borderTop: `4px solid ${program.color}`,
                  }}
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {program.name}
                      </p>
                      {member && (
                        <p className="mt-0.5 text-sm text-slate-500">
                          {member.avatarEmoji} {member.name}
                        </p>
                      )}
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                      Edit
                    </span>
                  </div>
                  {program.description && (
                    <p className="mb-3 text-sm text-slate-500">
                      {program.description}
                    </p>
                  )}
                  <div className="space-y-2">
                    <Progress
                      label={`Sessions ${sessions}/${program.weeklyGoalSessions}`}
                      pct={sessionPct}
                      color={program.color}
                    />
                    <Progress
                      label={`Minutes ${minutes}/${program.weeklyGoalMinutes}`}
                      pct={minutePct}
                      color={program.color}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {program.activityTypes.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-slate-50 px-2 py-0.5 text-xs text-slate-600"
                      >
                        {ACTIVITY_EMOJIS[t]} {ACTIVITY_LABELS[t]}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent logs */}
      <section className="card">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Recent activity
        </h3>
        {sortedLogs.length === 0 ? (
          <p className="py-8 text-center text-slate-500">
            No workouts logged yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {sortedLogs.slice(0, 20).map((log) => {
              const member = getMember(log.memberId);
              return (
                <li
                  key={log.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-xl">
                    {ACTIVITY_EMOJIS[log.activityType]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{log.title}</p>
                    <p className="text-sm text-slate-500">
                      {member?.avatarEmoji} {member?.name} · {log.date} ·{" "}
                      {log.durationMinutes} min
                      {log.distanceMiles
                        ? ` · ${log.distanceMiles} mi`
                        : ""}
                      {log.calories ? ` · ${log.calories} cal` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFitnessLog(log.id)}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-slate-400 hover:bg-rose-50 hover:text-rose-600"
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

function Progress({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-medium text-slate-500">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
