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
import {
  findDay,
  getWeekIndexForDate,
  todayISO,
} from "@/lib/fitness/programGenerator.js";

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
  const hour = new Date().getHours();
  const greet =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="mori-fitness">
      <div className="mf-page">
        {/* Hero — Mori-style */}
        <header className="mf-card mf-hero">
          <p className="mf-micro">Training floor</p>
          <h1 className="mf-display" style={{ marginTop: 6 }}>
            {greet}
          </h1>
          <p className="mf-caption" style={{ marginTop: 8, maxWidth: 420 }}>
            Quiet strength. Log free activities or run a bold 4-week program —
            same industrial gym energy as Mori.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginTop: 18,
            }}
          >
            <button
              type="button"
              className="mf-btn mf-btn-primary"
              onClick={onAddLog}
              disabled={!canLog}
            >
              Log activity
            </button>
            <button
              type="button"
              className="mf-btn mf-btn-gold"
              onClick={onCreateProgram}
              disabled={!canLog}
            >
              Create program
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="mf-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "activities"}
            className={`mf-tab ${tab === "activities" ? "is-active" : ""}`}
            onClick={() => setTab("activities")}
          >
            <strong>Activities</strong>
            <span>Walk, sports, steps, swim…</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "programs"}
            className={`mf-tab ${tab === "programs" ? "is-active" : ""}`}
            onClick={() => setTab("programs")}
          >
            <strong>Programs</strong>
            <span>4-week strength plans</span>
          </button>
        </div>

        {/* Members */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button
            type="button"
            className={`mf-chip ${memberFilter === "all" ? "is-active" : ""}`}
            onClick={() => setMemberFilter("all")}
          >
            Everyone
          </button>
          {members.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`mf-chip ${memberFilter === m.id ? "is-active" : ""}`}
              onClick={() => setMemberFilter(m.id)}
            >
              <Avatar member={m} size="sm" />
              {m.name}
            </button>
          ))}
        </div>

        {tab === "activities" && (
          <>
            <div className="mf-stats">
              <div className="mf-stat mf-stat--hot">
                <label>Minutes · {rangeDays}d</label>
                <strong>{totalMinutes}</strong>
              </div>
              <div className="mf-stat">
                <label>Sessions</label>
                <strong>{totalSessions}</strong>
              </div>
              <div className="mf-stat mf-stat--gold">
                <label>Distance</label>
                <strong>{totalMiles.toFixed(1)}</strong>
              </div>
              <div className="mf-stat">
                <label>Steps</label>
                <strong>
                  {totalSteps > 0 ? totalSteps.toLocaleString() : "—"}
                </strong>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 6,
              }}
            >
              {([7, 14, 30] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`mf-chip mf-chip-gold ${rangeDays === d ? "is-active" : ""}`}
                  onClick={() => setRangeDays(d)}
                >
                  {d}d
                </button>
              ))}
            </div>

            <section className="mf-card">
              <h2 className="mf-h2">Activity trend</h2>
              <p className="mf-caption mf-muted" style={{ marginTop: 4 }}>
                Minutes per day
              </p>
              <div className="mf-chart" style={{ marginTop: 16 }}>
                {dailyMinutes.map(({ key, mins }) => {
                  const heightPct = Math.max(
                    mins > 0 ? 10 : 0,
                    (mins / maxDay) * 100
                  );
                  return (
                    <div key={key} className="mf-bar-col" title={`${key}: ${mins}m`}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: "var(--m-ink-muted)",
                        }}
                      >
                        {mins > 0 ? mins : ""}
                      </span>
                      <div className="mf-bar-track">
                        <div
                          className={`mf-bar ${key === todayKey ? "is-today" : ""} ${mins === 0 ? "is-empty" : ""}`}
                          style={{
                            height: mins === 0 ? 2 : `${heightPct}%`,
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: "var(--m-ink-faint)",
                        }}
                      >
                        {key.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="mf-card">
              <h2 className="mf-h3">Quick log</h2>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 12,
                }}
              >
                {(Object.keys(ACTIVITY_LABELS) as FitnessActivityType[]).map(
                  (t) => (
                    <button
                      key={t}
                      type="button"
                      className="mf-chip"
                      onClick={onAddLog}
                      disabled={!canLog}
                    >
                      {ACTIVITY_EMOJIS[t]} {ACTIVITY_LABELS[t]}
                    </button>
                  )
                )}
              </div>
            </section>

            {byActivity.length > 0 && (
              <section className="mf-card">
                <h2 className="mf-h3">By activity</h2>
                <ul className="mf-list" style={{ marginTop: 8 }}>
                  {byActivity.map(({ type, minutes }) => {
                    const pct = Math.round(
                      (minutes / Math.max(1, totalMinutes)) * 100
                    );
                    return (
                      <li key={type} style={{ flexDirection: "column", alignItems: "stretch" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontWeight: 700,
                            fontSize: 14,
                          }}
                        >
                          <span>
                            {ACTIVITY_EMOJIS[type]} {ACTIVITY_LABELS[type]}
                          </span>
                          <span style={{ color: "var(--m-steel)" }}>
                            {minutes}m · {pct}%
                          </span>
                        </div>
                        <div className="mf-progress" style={{ marginTop: 8 }}>
                          <i style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <section className="mf-card">
              <h2 className="mf-h3">Activity log</h2>
              {sortedLogs.length === 0 ? (
                <div className="mf-empty" style={{ marginTop: 12 }}>
                  <p className="mf-h3">Nothing logged yet</p>
                  <p className="mf-caption" style={{ marginTop: 8 }}>
                    Start with a walk, sport, or steps.
                  </p>
                  <button
                    type="button"
                    className="mf-btn mf-btn-primary"
                    style={{ marginTop: 16 }}
                    onClick={onAddLog}
                    disabled={!canLog}
                  >
                    Log activity
                  </button>
                </div>
              ) : (
                <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0 }}>
                  {sortedLogs.slice(0, 40).map((log) => {
                    const member = getMember(log.memberId);
                    return (
                      <li
                        key={log.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "12px 14px",
                          marginBottom: 8,
                          borderRadius: 12,
                          background: "#ffffff",
                          border: "2px solid #111827",
                        }}
                      >
                        <span
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 22,
                            background: "#fff7ed",
                            border: "1px solid #fdba74",
                            flexShrink: 0,
                          }}
                        >
                          {ACTIVITY_EMOJIS[log.activityType] || "🏋️"}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              margin: 0,
                              fontWeight: 900,
                              fontSize: 16,
                              color: "#0a0a0a",
                              lineHeight: 1.3,
                            }}
                          >
                            {log.title}
                            {log.source === "program" && (
                              <span
                                style={{
                                  marginLeft: 8,
                                  fontSize: 10,
                                  fontWeight: 800,
                                  color: "#9a3412",
                                  letterSpacing: "0.06em",
                                  textTransform: "uppercase",
                                  background: "#ffedd5",
                                  padding: "2px 6px",
                                  borderRadius: 6,
                                }}
                              >
                                Program
                              </span>
                            )}
                          </p>
                          <p
                            style={{
                              margin: "4px 0 0",
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#1f2937",
                            }}
                          >
                            {member?.name ?? "—"} · {log.date}
                            {log.durationMinutes
                              ? ` · ${log.durationMinutes} min`
                              : ""}
                            {log.distanceMiles
                              ? ` · ${log.distanceMiles} mi`
                              : ""}
                            {log.steps
                              ? ` · ${log.steps.toLocaleString()} steps`
                              : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFitnessLog(log.id)}
                          style={{
                            minHeight: 36,
                            padding: "0 12px",
                            borderRadius: 10,
                            border: "1px solid #d1d5db",
                            background: "#f3f4f6",
                            color: "#111827",
                            fontWeight: 800,
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          Remove
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}

        {tab === "programs" && (
          <>
            {programs.length === 0 ? (
              <div className="mf-card mf-empty">
                <p className="mf-micro">Mori engine</p>
                <h2 className="mf-display" style={{ fontSize: "1.4rem", marginTop: 8 }}>
                  Build your plan
                </h2>
                <p
                  className="mf-caption"
                  style={{ margin: "12px auto 0", maxWidth: 360 }}
                >
                  Personalized 4-week program from goals, experience, and
                  equipment — sets, reps, rest, deload week.
                </p>
                <button
                  type="button"
                  className="mf-btn mf-btn-gold"
                  style={{ marginTop: 20 }}
                  onClick={onCreateProgram}
                  disabled={!canLog}
                >
                  Create program
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {programs.map((p) => {
                    const m = getMember(p.memberId);
                    const selected = viewProgram?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={`mf-chip ${selected ? "is-active" : ""}`}
                        onClick={() => {
                          setViewProgramId(p.id);
                          setWeekIdx(getWeekIndexForDate(p, todayKey) || 0);
                        }}
                      >
                        {p.name || p.primaryGoalLabel}
                        {p.active ? " · Active" : ""}
                        {m ? ` · ${m.name}` : ""}
                      </button>
                    );
                  })}
                </div>

                {viewProgram && (
                  <ProgramPanel
                    program={viewProgram}
                    weekIdx={weekIdx}
                    setWeekIdx={setWeekIdx}
                    todayKey={todayKey}
                    memberName={getMember(viewProgram.memberId)?.name}
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
    </div>
  );
}

function ProgramPanel({
  program,
  weekIdx,
  setWeekIdx,
  todayKey,
  memberName,
  logs,
  onActivate,
  onDelete,
  onLogDay,
}: {
  program: WorkoutProgram;
  weekIdx: number;
  setWeekIdx: (n: number) => void;
  todayKey: string;
  memberName?: string;
  logs: { programId?: string; sessionDayId?: string }[];
  onActivate: () => void;
  onDelete: () => void;
  onLogDay: (day: WorkoutProgramDay) => void;
}) {
  const week = program.weeks[weekIdx] || program.weeks[0];
  const foundToday = findDay(program, todayKey);
  const completedIds = new Set(
    logs
      .filter((l) => l.programId === program.id && l.sessionDayId)
      .map((l) => l.sessionDayId)
  );
  const weekDone = week.days.filter(
    (d) => d.type !== "rest" && completedIds.has(d.id)
  ).length;
  const weekWork = week.days.filter((d) => d.type !== "rest").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <section className="mf-card mf-hero">
        <p className="mf-micro">
          {program.primaryGoalLabel} · {program.split.replace(/_/g, " ")}
        </p>
        <h2 className="mf-workout-name" style={{ fontSize: "1.45rem", marginTop: 6 }}>
          {program.name || program.primaryGoalLabel}
        </h2>
        <p className="mf-workout-meta" style={{ marginTop: 6, fontSize: 14 }}>
          {memberName} · {program.rtDaysPerWeek} day
          {program.rtDaysPerWeek === 1 ? "" : "s"}/week
          {program.scheduleRepeat
            ? ` · ${program.scheduleRepeat}`
            : ""}{" "}
          · double progression
        </p>
        {program.availableDays && program.availableDays.length > 0 && (
          <p className="mf-workout-meta" style={{ marginTop: 6, fontSize: 13 }}>
            Available:{" "}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
              .filter((_, i) => program.availableDays!.includes(i))
              .join(", ")}
          </p>
        )}
        <p className="mf-workout-meta" style={{ marginTop: 10, fontSize: 13 }}>
          {program.progressionNotes}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
          {foundToday?.day && foundToday.day.type !== "rest" && (
            <button
              type="button"
              className="mf-btn mf-btn-primary"
              onClick={() => onLogDay(foundToday.day)}
            >
              {completedIds.has(foundToday.day.id)
                ? "Log again · "
                : "Start today · "}
              {foundToday.day.title}
            </button>
          )}
          {!program.active && (
            <button
              type="button"
              className="mf-btn mf-btn-gold"
              onClick={onActivate}
            >
              Set active
            </button>
          )}
          <button
            type="button"
            className="mf-btn mf-btn-ghost"
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      </section>

      <div
        className="mf-card"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <button
          type="button"
          className="mf-btn mf-btn-secondary"
          style={{ minHeight: 40, padding: "0 14px" }}
          disabled={weekIdx <= 0}
          onClick={() => setWeekIdx(weekIdx - 1)}
        >
          ‹
        </button>
        <div style={{ textAlign: "center" }}>
          <p className="mf-h3">
            Week {week.week}
            {week.deload ? " · Deload" : ""}
          </p>
          <p className="mf-caption mf-muted" style={{ textShadow: "none" }}>
            {weekDone}/{weekWork} logged · {week.startDate}
          </p>
        </div>
        <button
          type="button"
          className="mf-btn mf-btn-secondary"
          style={{ minHeight: 40, padding: "0 14px" }}
          disabled={weekIdx >= program.weeks.length - 1}
          onClick={() => setWeekIdx(weekIdx + 1)}
        >
          ›
        </button>
      </div>

      <div className="mf-week">
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
              className={`mf-day ${isToday ? "is-today" : ""} ${done ? "is-done" : ""} ${isRest ? "is-rest" : ""}`}
            >
              <div className="dow">{day.dayName}</div>
              <div className="mf-workout-name" style={{ fontSize: 15, marginTop: 2 }}>
                {day.date.slice(8)}
              </div>
              <div className="mf-workout-name" style={{ fontSize: 13, marginTop: 6 }}>
                {day.title}
              </div>
              {!isRest && (
                <div className="mf-workout-meta" style={{ fontSize: 11, marginTop: 4 }}>
                  {day.exercises.length} moves · ~{day.estimatedMinutes}m
                  {done ? " · ✓" : ""}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {week.days
        .filter((d) => d.type === "rt")
        .slice(0, 1)
        .map((day) => (
          <section key={day.id + "-ex"} className="mf-card">
            <p className="mf-micro">Session blueprint</p>
            <h3
              className="mf-workout-name mf-workout-name--block"
              style={{ marginTop: 8 }}
            >
              {day.title}
            </h3>
            <ul className="mf-list">
              {day.exercises.map((ex, i) => (
                <li key={ex.exerciseId + i}>
                  <span className="mf-icon" style={{ fontSize: 12, fontWeight: 800 }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p
                      className="mf-workout-name mf-workout-name--block"
                      style={{ margin: 0 }}
                    >
                      {ex.name}
                    </p>
                    {ex.cues && (
                      <p
                        className="mf-workout-meta"
                        style={{ margin: "2px 0 0", fontSize: 12 }}
                      >
                        {ex.cues}
                      </p>
                    )}
                  </div>
                  <span style={{ fontWeight: 800, color: "#ffd666", fontSize: 13 }}>
                    {ex.sets}×{ex.repsLabel}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}
