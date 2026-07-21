"use client";

import { useMemo, useState } from "react";
import { useFamilyStore } from "@/context/FamilyStore";
import { Avatar } from "@/components/ui/Avatar";
import type { CalendarEvent } from "@/lib/types";
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
          <h2 className="ml-2 text-xl font-semibold text-slate-900">{title}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["month", "week", "day"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
                mode === m
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {m}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onAddEvent(toDateKey(cursor))}
            className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-sky-600/20 transition hover:bg-sky-700"
          >
            + Event
          </button>
        </div>
      </div>

      {/* Member filters */}
      <div className="flex flex-wrap gap-2">
        {members.map((m) => {
          const on = visibleMembers.has(m.id);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggleMember(m.id)}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                on
                  ? "bg-white text-slate-800 shadow-sm ring-2"
                  : "bg-slate-100 text-slate-400 opacity-60"
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
          onDayClick={(d) => {
            setCursor(d);
            setMode("day");
          }}
          onEventClick={onEditEvent}
          onAdd={onAddEvent}
        />
      )}
      {mode === "week" && (
        <WeekGrid
          cursor={cursor}
          events={filteredEvents}
          getMember={getMember}
          onEventClick={onEditEvent}
          onAdd={onAddEvent}
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

function MonthGrid({
  cursor,
  events,
  getMember,
  onDayClick,
  onEventClick,
  onAdd,
}: {
  cursor: Date;
  events: CalendarEvent[];
  getMember: (id: string) => ReturnType<typeof useFamilyStore>["getMember"] extends (id: string) => infer R ? R : never;
  onDayClick: (d: Date) => void;
  onEventClick: (e: CalendarEvent) => void;
  onAdd: (dateKey?: string) => void;
}) {
  const days = getMonthGrid(cursor);
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="card overflow-hidden p-0">
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/80">
        {weekdays.map((d) => (
          <div
            key={d}
            className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const inMonth = day.getMonth() === cursor.getMonth();
          const dayEvents = events
            .filter((e) => isSameDay(new Date(e.start), day))
            .slice(0, 3);
          const more =
            events.filter((e) => isSameDay(new Date(e.start), day)).length -
            dayEvents.length;

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[100px] border-b border-r border-slate-100 p-1.5 sm:min-h-[120px] ${
                inMonth ? "bg-white" : "bg-slate-50/50"
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onDayClick(day)}
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold transition ${
                    isToday(day)
                      ? "bg-sky-600 text-white"
                      : inMonth
                        ? "text-slate-800 hover:bg-slate-100"
                        : "text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  {day.getDate()}
                </button>
                <button
                  type="button"
                  onClick={() => onAdd(toDateKey(day))}
                  className="hidden h-6 w-6 items-center justify-center rounded-full text-slate-300 hover:bg-sky-50 hover:text-sky-600 sm:flex"
                  aria-label="Add event"
                >
                  +
                </button>
              </div>
              <div className="space-y-0.5">
                {dayEvents.map((e) => {
                  const m = getMember(e.memberId);
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => onEventClick(e)}
                      className="block w-full truncate rounded-md px-1.5 py-0.5 text-left text-[11px] font-medium text-white sm:text-xs"
                      style={{ backgroundColor: m?.color ?? "#64748b" }}
                      title={e.title}
                    >
                      {e.title}
                    </button>
                  );
                })}
                {more > 0 && (
                  <button
                    type="button"
                    onClick={() => onDayClick(day)}
                    className="px-1 text-[11px] font-medium text-slate-400"
                  >
                    +{more} more
                  </button>
                )}
              </div>
            </div>
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
}: {
  cursor: Date;
  events: CalendarEvent[];
  getMember: (id: string) => ReturnType<typeof useFamilyStore>["getMember"] extends (id: string) => infer R ? R : never;
  onEventClick: (e: CalendarEvent) => void;
  onAdd: (dateKey?: string) => void;
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
            className={`card min-h-[200px] ${
              isToday(day) ? "ring-2 ring-sky-400" : ""
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">
                  {day.toLocaleDateString([], { weekday: "short" })}
                </p>
                <p
                  className={`text-lg font-bold ${
                    isToday(day) ? "text-sky-600" : "text-slate-900"
                  }`}
                >
                  {day.getDate()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onAdd(toDateKey(day))}
                className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500 hover:bg-sky-50 hover:text-sky-600"
              >
                +
              </button>
            </div>
            <ul className="space-y-1.5">
              {dayEvents.map((e) => {
                const m = getMember(e.memberId);
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => onEventClick(e)}
                      className="w-full rounded-xl p-2 text-left text-xs transition hover:opacity-90"
                      style={{
                        backgroundColor: `${m?.color ?? "#64748b"}18`,
                        borderLeft: `3px solid ${m?.color ?? "#64748b"}`,
                      }}
                    >
                      <p className="font-semibold text-slate-800">{e.title}</p>
                      <p className="text-slate-500">
                        {e.allDay ? "All day" : formatTime(e.start)}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
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
  getMember: (id: string) => ReturnType<typeof useFamilyStore>["getMember"] extends (id: string) => infer R ? R : never;
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
        <h3 className="text-lg font-semibold text-slate-900">
          {isToday(cursor) ? "Today" : "Day schedule"}
        </h3>
        <button
          type="button"
          onClick={() => onAdd(toDateKey(cursor))}
          className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white"
        >
          + Event
        </button>
      </div>
      {dayEvents.length === 0 ? (
        <p className="py-12 text-center text-slate-500">No events this day.</p>
      ) : (
        <ul className="space-y-3">
          {dayEvents.map((e) => {
            const m = getMember(e.memberId);
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => onEventClick(e)}
                  className="flex w-full items-stretch gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-left transition hover:border-sky-200 hover:bg-sky-50/40"
                >
                  <div className="w-20 shrink-0 text-center">
                    {e.allDay ? (
                      <span className="text-sm font-semibold text-slate-500">
                        All day
                      </span>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-slate-900">
                          {formatTime(e.start)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatTime(e.end)}
                        </p>
                      </>
                    )}
                  </div>
                  <div
                    className="w-1 rounded-full"
                    style={{ backgroundColor: m?.color ?? "#94a3b8" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{e.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {m?.avatarEmoji} {m?.name}
                      {e.location ? ` · ${e.location}` : ""}
                    </p>
                    {e.description && (
                      <p className="mt-1 text-sm text-slate-400">
                        {e.description}
                      </p>
                    )}
                  </div>
                  {e.source !== "local" && (
                    <span className="self-start rounded-full bg-white px-2 py-1 text-xs capitalize text-slate-500 ring-1 ring-slate-200">
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
