"use client";

import { useMemo } from "react";
import { useFamilyStore } from "@/context/FamilyStore";
import { Avatar } from "@/components/ui/Avatar";
import {
  formatDateLong,
  formatTime,
  isSameDay,
  toDateKey,
} from "@/lib/date-utils";
import { ACTIVITY_EMOJIS } from "@/lib/types";
import type { CalendarEvent, Chore } from "@/lib/types";
import { choreAssigneeIds } from "@/lib/types";

interface TodayHubProps {
  onAddEvent: () => void;
  onEditEvent: (event: CalendarEvent) => void;
  onAddChore: () => void;
  onAddFitness: () => void;
  onNavigate: (view: "calendar" | "chores" | "fitness") => void;
}

export function TodayHub({
  onAddEvent,
  onEditEvent,
  onAddChore,
  onAddFitness,
  onNavigate,
}: TodayHubProps) {
  const {
    events,
    chores,
    fitnessLogs,
    members,
    getMember,
    toggleChore,
    activeMemberId,
  } = useFamilyStore();

  const today = useMemo(() => new Date(), []);
  const todayKey = toDateKey(today);

  const todaysEvents = useMemo(
    () =>
      events
        .filter((e) => isSameDay(new Date(e.start), today))
        .sort(
          (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
        ),
    [events, today]
  );

  const todaysChores = useMemo(
    () =>
      chores.filter((c) => {
        // Dated chores due today/overdue + open undated tasks
        if (!c.dueDate) return !c.completed;
        return c.dueDate <= todayKey;
      }),
    [chores, todayKey]
  );

  const pendingChores = todaysChores.filter((c) => !c.completed);
  const doneChores = todaysChores.filter((c) => c.completed);

  const todaysFitness = useMemo(
    () => fitnessLogs.filter((f) => f.date === todayKey),
    [fitnessLogs, todayKey]
  );

  const totalMinutes = todaysFitness.reduce(
    (sum, f) => sum + f.durationMinutes,
    0
  );

  const choreProgress =
    todaysChores.length === 0
      ? 100
      : Math.round((doneChores.length / todaysChores.length) * 100);

  return (
    <div className="space-y-6">
      {/* Compact kitchen hub strip */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-md sm:px-5">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
            Kitchen hub
          </p>
          <h1 className="truncate text-base font-bold tracking-tight sm:text-lg">
            {formatDateLong(today)}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <QuickStat
            label="Events"
            value={String(todaysEvents.length)}
            onClick={() => onNavigate("calendar")}
          />
          <QuickStat
            label="Chores"
            value={String(pendingChores.length)}
            onClick={() => onNavigate("chores")}
          />
          <QuickStat
            label="Fit min"
            value={String(totalMinutes)}
            onClick={() => onNavigate("fitness")}
          />
          <QuickStat label="Done" value={`${choreProgress}%`} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Schedule */}
        <section className="card lg:col-span-2">
          <Header
            title="Today's schedule"
            actionLabel="+ Event"
            onAction={onAddEvent}
            onSeeAll={() => onNavigate("calendar")}
          />
          {todaysEvents.length === 0 ? (
            <Empty
              message="No events today — enjoy the calm."
              action="Add event"
              onAction={onAddEvent}
            />
          ) : (
            <ul className="space-y-2">
              {todaysEvents.map((event) => {
                const member = getMember(event.memberId);
                return (
                  <li key={event.id}>
                    <button
                      type="button"
                      onClick={() => onEditEvent(event)}
                      className="flex w-full items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-left transition hover:border-sky-200 hover:bg-sky-50/60"
                    >
                      <div
                        className="w-1.5 self-stretch rounded-full"
                        style={{
                          backgroundColor: member?.color ?? "#94a3b8",
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            {event.title}
                          </span>
                          {event.allDay ? (
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                              All day
                            </span>
                          ) : (
                            <span className="text-sm text-slate-500">
                              {formatTime(event.start)}
                              {" – "}
                              {formatTime(event.end)}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                          {member && (
                            <span>
                              {member.avatarEmoji} {member.name}
                            </span>
                          )}
                          {event.location && <span>· {event.location}</span>}
                          {event.source !== "local" && (
                            <span className="rounded-full bg-white px-2 py-0.5 text-xs capitalize text-slate-500 ring-1 ring-slate-200">
                              {event.source}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Chores snapshot */}
        <section className="card">
          <Header
            title="Chores"
            actionLabel="+ Chore"
            onAction={onAddChore}
            onSeeAll={() => onNavigate("chores")}
          />
          <div className="mb-4">
            <div className="mb-1.5 flex justify-between text-xs font-medium text-slate-500">
              <span>
                {doneChores.length}/{todaysChores.length} done
              </span>
              <span>{choreProgress}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500"
                style={{ width: `${choreProgress}%` }}
              />
            </div>
          </div>
          {pendingChores.length === 0 ? (
            <p className="rounded-2xl bg-emerald-50 px-4 py-6 text-center text-sm font-medium text-emerald-700">
              🎉 All caught up for today!
            </p>
          ) : (
            <ul className="space-y-2">
              {pendingChores.slice(0, 5).map((chore) => (
                <ChoreRow
                  key={chore.id}
                  chore={chore}
                  onToggle={() =>
                    toggleChore(chore.id, activeMemberId ?? undefined)
                  }
                />
              ))}
              {pendingChores.length > 5 && (
                <button
                  type="button"
                  onClick={() => onNavigate("chores")}
                  className="w-full py-2 text-center text-sm font-medium text-sky-600 hover:text-sky-700"
                >
                  +{pendingChores.length - 5} more
                </button>
              )}
            </ul>
          )}
        </section>

        {/* Family strip */}
        <section className="card lg:col-span-2">
          <Header title="Family" />
          <div className="grid gap-3 sm:grid-cols-2">
            {members.map((member) => {
              const mEvents = todaysEvents.filter(
                (e) => e.memberId === member.id
              );
              const mChores = todaysChores.filter((c) =>
                choreAssigneeIds(c).includes(member.id)
              );
              const mDone = mChores.filter((c) => c.completed).length;
              const mFit = todaysFitness.filter(
                (f) => f.memberId === member.id
              );
              return (
                <div
                  key={member.id}
                  className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
                >
                  <Avatar member={member} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{member.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {mEvents.length} event{mEvents.length !== 1 ? "s" : ""} ·{" "}
                      {mDone}/{mChores.length} chores
                      {mFit.length > 0 &&
                        ` · ${mFit.reduce((s, f) => s + f.durationMinutes, 0)} min active`}
                    </p>
                    {member.calendarConnections.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {member.calendarConnections.map((c) => (
                          <span
                            key={c.id}
                            className="rounded-full bg-white px-2 py-0.5 text-xs capitalize text-slate-500 ring-1 ring-slate-200"
                          >
                            {c.provider}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Fitness today */}
        <section className="card">
          <Header
            title="Fitness today"
            actionLabel="+ Log"
            onAction={onAddFitness}
            onSeeAll={() => onNavigate("fitness")}
          />
          {todaysFitness.length === 0 ? (
            <Empty
              message="No workouts logged yet."
              action="Log workout"
              onAction={onAddFitness}
            />
          ) : (
            <ul className="space-y-2">
              {todaysFitness.map((log) => {
                const member = getMember(log.memberId);
                return (
                  <li
                    key={log.id}
                    className="flex items-center gap-3 rounded-2xl bg-violet-50/80 px-3 py-3"
                  >
                    <span className="text-2xl">
                      {ACTIVITY_EMOJIS[log.activityType]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">
                        {log.title}
                      </p>
                      <p className="text-sm text-slate-500">
                        {member?.name} · {log.durationMinutes} min
                        {log.distanceMiles
                          ? ` · ${log.distanceMiles} mi`
                          : ""}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Header({
  title,
  actionLabel,
  onAction,
  onSeeAll,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  onSeeAll?: () => void;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="flex items-center gap-2">
        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            See all
          </button>
        )}
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function QuickStat({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className="min-w-[4.25rem] rounded-xl bg-white/10 px-2.5 py-1.5 text-left ring-1 ring-white/20 transition hover:bg-white/20"
    >
      <div className="text-base font-bold tabular-nums text-white sm:text-lg">
        {value}
      </div>
      <div className="text-[10px] font-bold text-slate-200">{label}</div>
    </Comp>
  );
}

function Empty({
  message,
  action,
  onAction,
}: {
  message: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center">
      <p className="text-sm text-slate-500">{message}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-3 text-sm font-semibold text-sky-600 hover:text-sky-700"
      >
        {action}
      </button>
    </div>
  );
}

function ChoreRow({
  chore,
  onToggle,
}: {
  chore: Chore;
  onToggle: () => void;
}) {
  const { getMember } = useFamilyStore();
  const names = choreAssigneeIds(chore)
    .map((id) => getMember(id)?.name)
    .filter(Boolean)
    .join(", ");
  const overdue =
    !!chore.dueDate && chore.dueDate < toDateKey(new Date());

  return (
    <li className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
      <button
        type="button"
        onClick={onToggle}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-slate-300 text-transparent transition hover:border-emerald-400 hover:bg-emerald-50"
        aria-label="Complete chore"
      >
        ✓
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800">
          {chore.title}
        </p>
        <p className="text-xs text-slate-600">
          {names || "Unassigned"}
          {!chore.dueDate && (
            <span className="ml-1 font-semibold text-sky-700">· no due date</span>
          )}
          {overdue && (
            <span className="ml-1 font-medium text-rose-500">· overdue</span>
          )}
        </p>
      </div>
      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
        +{chore.points}
      </span>
    </li>
  );
}
