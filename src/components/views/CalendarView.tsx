"use client";

import { useMemo, useState } from "react";
import { useFamilyStore } from "@/context/FamilyStore";
import { Avatar } from "@/components/ui/Avatar";
import type { CalendarEvent, FamilyMember } from "@/lib/types";
import { solidEventBg, textOnColor } from "@/lib/contrast";
import {
  addDays,
  addMonths,
  formatMonthYear,
  formatTime,
  getMonthGrid,
  getWeekDays,
  isSameDay,
  isToday,
  toDateKey,
} from "@/lib/date-utils";

interface CalendarViewProps {
  onAddEvent: (dateKey?: string) => void;
  onEditEvent: (event: CalendarEvent) => void;
}

type Mode = "month" | "week" | "day";

export function CalendarView({ onAddEvent, onEditEvent }: CalendarViewProps) {
  const { events, members, getMember } = useFamilyStore();
  const [cursor, setCursor] = useState(() => new Date());
  const [mode, setMode] = useState<Mode>("month");
  const [filterIds, setFilterIds] = useState<Set<string> | null>(null);

  const visibleMembers = useMemo(() => {
    if (!filterIds) return new Set(members.map((m) => m.id));
    return filterIds;
  }, [filterIds, members]);

  const filteredEvents = useMemo(
    () => events.filter((e) => visibleMembers.has(e.memberId)),
    [events, visibleMembers]
  );

  const toggleMember = (id: string) => {
    setFilterIds((prev) => {
      const base = prev ?? new Set(members.map((m) => m.id));
      const next = new Set(base);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (next.size === members.length) return null;
      return next;
    });
  };

  const goToday = () => setCursor(new Date());
  const goPrev = () => {
    if (mode === "month") setCursor((d) => addMonths(d, -1));
    else if (mode === "week") setCursor((d) => addDays(d, -7));
    else setCursor((d) => addDays(d, -1));
  };
  const goNext = () => {
    if (mode === "month") setCursor((d) => addMonths(d, 1));
    else if (mode === "week") setCursor((d) => addDays(d, 7));
    else setCursor((d) => addDays(d, 1));
  };

  const openDay = (d: Date) => {
    setCursor(d);
    setMode("day");
  };

  const title =
    mode === "month"
      ? formatMonthYear(cursor)
      : mode === "week"
        ? `Week of ${getWeekDays(cursor)[0].toLocaleDateString([], { month: "short", day: "numeric" })}`
        : cursor.toLocaleDateString([], {
            weekday: "long",
            month: "long",
            day: "numeric",
          });

  return (
    <div className="space-y-4">
      <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button type="button" onClick={goPrev} className="nav-btn">
            ‹
          </button>
          <button type="button" onClick={goToday} className="nav-btn text-sm">
            Today
          </button>
          <button type="button" onClick={goNext} className="nav-btn">
            ›
          </button>
          <h2 className="ml-2 text-xl font-bold text-slate-900">{title}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["month", "week", "day"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-full px-4 py-2 text-sm font-bold capitalize transition ${
                mode === m
                  ? "bg-slate-900 text-white"
                  : "bg-slate-200 text-slate-800 hover:bg-slate-300"
              }`}
            >
              {m}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onAddEvent(toDateKey(cursor))}
            className="rounded-full bg-sky-700 px-4 py-2 text-sm font-bold text-white shadow-md shadow-sky-700/25 transition hover:bg-sky-800"
          >
            + Event
          </button>
        </div>
      </div>

      <p className="text-sm font-medium text-slate-700">
        Tip: click any date on the calendar to add an event for that day.
      </p>

      {/* Member filters */}
      <div className="flex flex-wrap gap-2">
        {members.map((m) => {
          const on = visibleMembers.has(m.id);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggleMember(m.id)}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                on
                  ? "bg-white text-slate-900 shadow-sm ring-2"
                  : "bg-slate-200 text-slate-600 opacity-70"
              }`}
              style={on ? { ["--tw-ring-color" as string]: m.color } : undefined}
            >
              <Avatar member={m} size="sm" />
              {m.name}
            </button>
          );
        })}
      </div>

      {mode === "month" && (
        <MonthGrid
          cursor={cursor}
          events={filteredEvents}
          getMember={getMember}
          onAdd={onAddEvent}
          onEventClick={onEditEvent}
          onOpenDay={openDay}
        />
      )}
      {mode === "week" && (
        <WeekGrid
          cursor={cursor}
          events={filteredEvents}
          getMember={getMember}
          onEventClick={onEditEvent}
          onAdd={onAddEvent}
          onOpenDay={openDay}
        />
      )}
      {mode === "day" && (
        <DayList
          cursor={cursor}
          events={filteredEvents}
          getMember={getMember}
          onEventClick={onEditEvent}
          onAdd={onAddEvent}
        />
      )}
    </div>
  );
}

function EventChip({
  event,
  member,
  onClick,
}: {
  event: CalendarEvent;
  member?: FamilyMember;
  onClick: () => void;
}) {
  const color = member?.color ?? "#334155";
  const bg = solidEventBg(color);
  const fg = textOnColor(bg);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="event-chip"
      style={{
        backgroundColor: bg,
        color: fg,
        textShadow: fg === "#ffffff" ? "0 1px 1px rgba(0,0,0,0.3)" : "none",
      }}
      title={event.title}
    >
      {event.title}
    </button>
  );
}

function MonthGrid({
  cursor,
  events,
  getMember,
  onAdd,
  onEventClick,
  onOpenDay,
}: {
  cursor: Date;
  events: CalendarEvent[];
  getMember: (id: string) => FamilyMember | undefined;
  onAdd: (dateKey?: string) => void;
  onEventClick: (e: CalendarEvent) => void;
  onOpenDay: (d: Date) => void;
}) {
  const days = getMonthGrid(cursor);
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="card overflow-hidden p-0">
      <div className="grid grid-cols-7 border-b border-slate-300 bg-slate-100">
        {weekdays.map((d) => (
          <div
            key={d}
            className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-700"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const inMonth = day.getMonth() === cursor.getMonth();
          const allDayEvents = events.filter((e) =>
            isSameDay(new Date(e.start), day)
          );
          const dayEvents = allDayEvents.slice(0, 3);
          const more = allDayEvents.length - dayEvents.length;
          const today = isToday(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onAdd(toDateKey(day))}
              className={`cal-day ${!inMonth ? "cal-day--muted" : ""} ${
                today ? "cal-day--today" : ""
              }`}
              aria-label={`Add event on ${day.toLocaleDateString()}`}
            >
              <div className="mb-1 flex items-center justify-between gap-1">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    today
                      ? "bg-sky-700 text-white"
                      : inMonth
                        ? "text-slate-900"
                        : "text-slate-500"
                  }`}
                >
                  {day.getDate()}
                </span>
                <span className="rounded-md bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-800 opacity-0 transition group-hover:opacity-100 sm:opacity-70">
                  + Add
                </span>
              </div>
              <div className="space-y-0.5">
                {dayEvents.map((e) => (
                  <EventChip
                    key={e.id}
                    event={e}
                    member={getMember(e.memberId)}
                    onClick={() => onEventClick(e)}
                  />
                ))}
                {more > 0 && (
                  <span
                    role="link"
                    tabIndex={0}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onOpenDay(day);
                    }}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        ev.stopPropagation();
                        onOpenDay(day);
                      }
                    }}
                    className="block px-1 text-left text-[11px] font-bold text-sky-800 underline-offset-2 hover:underline"
                  >
                    +{more} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekGrid({
  cursor,
  events,
  getMember,
  onEventClick,
  onAdd,
  onOpenDay,
}: {
  cursor: Date;
  events: CalendarEvent[];
  getMember: (id: string) => FamilyMember | undefined;
  onEventClick: (e: CalendarEvent) => void;
  onAdd: (dateKey?: string) => void;
  onOpenDay: (d: Date) => void;
}) {
  const days = getWeekDays(cursor);

  return (
    <div className="grid gap-3 md:grid-cols-7">
      {days.map((day) => {
        const dayEvents = events
          .filter((e) => isSameDay(new Date(e.start), day))
          .sort(
            (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
          );
        return (
          <div
            key={day.toISOString()}
            className={`card min-h-[200px] p-3 ${
              isToday(day) ? "ring-2 ring-sky-600" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => onAdd(toDateKey(day))}
              className="mb-3 flex w-full items-center justify-between rounded-xl p-1 text-left transition hover:bg-sky-50"
              aria-label={`Add event on ${day.toLocaleDateString()}`}
            >
              <div>
                <p className="text-xs font-bold uppercase text-slate-600">
                  {day.toLocaleDateString([], { weekday: "short" })}
                </p>
                <p
                  className={`text-lg font-bold ${
                    isToday(day) ? "text-sky-800" : "text-slate-900"
                  }`}
                >
                  {day.getDate()}
                </p>
              </div>
              <span className="rounded-full bg-sky-700 px-2.5 py-1 text-xs font-bold text-white">
                +
              </span>
            </button>
            <ul className="space-y-1.5">
              {dayEvents.map((e) => {
                const m = getMember(e.memberId);
                const color = m?.color ?? "#334155";
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => onEventClick(e)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2 text-left text-xs transition hover:border-sky-300 hover:bg-sky-50"
                      style={{ borderLeft: `4px solid ${color}` }}
                    >
                      <p className="font-bold text-slate-900">{e.title}</p>
                      <p className="font-medium text-slate-600">
                        {e.allDay ? "All day" : formatTime(e.start)}
                      </p>
                    </button>
                  </li>
                );
              })}
              {dayEvents.length === 0 && (
                <button
                  type="button"
                  onClick={() => onAdd(toDateKey(day))}
                  className="w-full rounded-xl border border-dashed border-slate-300 py-6 text-xs font-semibold text-slate-600 hover:border-sky-400 hover:bg-sky-50 hover:text-sky-800"
                >
                  Tap to add
                </button>
              )}
            </ul>
            {dayEvents.length > 3 && (
              <button
                type="button"
                onClick={() => onOpenDay(day)}
                className="mt-2 w-full text-center text-xs font-bold text-sky-800"
              >
                View day
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DayList({
  cursor,
  events,
  getMember,
  onEventClick,
  onAdd,
}: {
  cursor: Date;
  events: CalendarEvent[];
  getMember: (id: string) => FamilyMember | undefined;
  onEventClick: (e: CalendarEvent) => void;
  onAdd: (dateKey?: string) => void;
}) {
  const dayEvents = events
    .filter((e) => isSameDay(new Date(e.start), cursor))
    .sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">
          {isToday(cursor) ? "Today" : "Day schedule"}
        </h3>
        <button
          type="button"
          onClick={() => onAdd(toDateKey(cursor))}
          className="rounded-full bg-sky-700 px-4 py-2 text-sm font-bold text-white"
        >
          + Event
        </button>
      </div>
      {dayEvents.length === 0 ? (
        <button
          type="button"
          onClick={() => onAdd(toDateKey(cursor))}
          className="w-full rounded-2xl border-2 border-dashed border-slate-300 py-12 text-center font-semibold text-slate-700 transition hover:border-sky-500 hover:bg-sky-50 hover:text-sky-900"
        >
          No events — click to add one
        </button>
      ) : (
        <ul className="space-y-3">
          {dayEvents.map((e) => {
            const m = getMember(e.memberId);
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => onEventClick(e)}
                  className="flex w-full items-stretch gap-4 rounded-2xl border border-slate-300 bg-white p-4 text-left transition hover:border-sky-400 hover:bg-sky-50"
                >
                  <div className="w-20 shrink-0 text-center">
                    {e.allDay ? (
                      <span className="text-sm font-bold text-slate-700">
                        All day
                      </span>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-slate-900">
                          {formatTime(e.start)}
                        </p>
                        <p className="text-xs font-medium text-slate-600">
                          {formatTime(e.end)}
                        </p>
                      </>
                    )}
                  </div>
                  <div
                    className="w-1.5 rounded-full"
                    style={{ backgroundColor: m?.color ?? "#64748b" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900">{e.title}</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {m?.name}
                      {e.location ? ` · ${e.location}` : ""}
                    </p>
                    {e.description && (
                      <p className="mt-1 text-sm text-slate-600">
                        {e.description}
                      </p>
                    )}
                  </div>
                  {e.source !== "local" && (
                    <span className="self-start rounded-full bg-slate-100 px-2 py-1 text-xs font-bold capitalize text-slate-700 ring-1 ring-slate-300">
                      {e.source}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
