"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { useFamilyStore } from "@/context/FamilyStore";
import type {
  ViewId,
  CalendarEvent,
  Chore,
  FamilyMember,
  WorkoutProgramDay,
} from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { TodayHub } from "@/components/views/TodayHub";
import { CalendarView } from "@/components/views/CalendarView";
import { ChoresView } from "@/components/views/ChoresView";
import { FitnessView } from "@/components/views/FitnessView";
import { FamilyView } from "@/components/views/FamilyView";
import { EventModal } from "@/components/modals/EventModal";
import { ChoreModal } from "@/components/modals/ChoreModal";
import { FitnessModal } from "@/components/modals/FitnessModal";
import { MemberModal } from "@/components/modals/MemberModal";
import { ConnectCalendarModal } from "@/components/modals/ConnectCalendarModal";
import { ProgramBuilderModal } from "@/components/modals/ProgramBuilderModal";
import { SessionLogModal } from "@/components/modals/SessionLogModal";

const NAV: { id: ViewId; label: string; icon: string }[] = [
  { id: "today", label: "Today", icon: "🏠" },
  { id: "calendar", label: "Calendar", icon: "📅" },
  { id: "chores", label: "Chores", icon: "✅" },
  { id: "fitness", label: "Fitness", icon: "💪" },
  { id: "family", label: "Family", icon: "👨‍👩‍👧‍👦" },
];

export function AppShell() {
  const { hydrated, members, activeMemberId, setActiveMember, familyName, getMember } =
    useFamilyStore();

  const [view, setView] = useState<ViewId>("today");
  const [clock, setClock] = useState(() => new Date());

  // Modals
  const [eventModal, setEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [eventDefaultDate, setEventDefaultDate] = useState<string | undefined>();

  const [choreModal, setChoreModal] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);

  const [fitnessModal, setFitnessModal] = useState(false);
  const [programBuilderOpen, setProgramBuilderOpen] = useState(false);
  const [sessionLog, setSessionLog] = useState<{
    memberId: string;
    programId: string;
    day: WorkoutProgramDay;
  } | null>(null);

  const [memberModal, setMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  const [connectOpen, setConnectOpen] = useState(false);
  const [connectMember, setConnectMember] = useState<FamilyMember | null>(null);
  const [connectProvider, setConnectProvider] = useState<"google" | "outlook" | null>(null);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const active = getMember(activeMemberId ?? "") ?? members[0];

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500" />
          <p className="font-medium text-slate-500">Loading family calendar…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-slate-900">
      {/* Soft ambient wash — kept subtle so text stays readable */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-50">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-sky-300/30 blur-3xl" />
        <div className="absolute -right-20 top-40 h-80 w-80 rounded-full bg-violet-300/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-3 pb-28 pt-3 sm:px-6 sm:pb-8 sm:pt-5 lg:px-8">
        {/* Top bar */}
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-300 bg-white px-4 py-3 shadow-md sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-700 text-xl shadow-lg shadow-sky-700/30">
              🗓️
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900 sm:text-base">
                {familyName}
              </p>
              <p className="text-xs font-medium text-slate-600 sm:text-sm">
                Kitchen Calendar
              </p>
            </div>
          </div>

          <div className="hidden text-center md:block">
            <p className="text-2xl font-bold tabular-nums tracking-tight text-slate-900">
              {clock.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
            <p className="text-xs font-semibold text-slate-600">
              {clock.toLocaleDateString([], {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1 sm:flex">
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveMember(m.id)}
                  className={`rounded-full p-0.5 transition ${
                    active?.id === m.id
                      ? "ring-2 ring-offset-1"
                      : "opacity-60 hover:opacity-100"
                  }`}
                  style={
                    active?.id === m.id
                      ? { ["--tw-ring-color" as string]: m.color }
                      : undefined
                  }
                  title={`Switch to ${m.name}`}
                >
                  <Avatar member={m} size="sm" />
                </button>
              ))}
            </div>
            {active && (
              <button
                type="button"
                onClick={() => {
                  setEditingMember(active);
                  setMemberModal(true);
                }}
                className="flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-1.5 ring-1 ring-slate-300 transition hover:bg-slate-200"
                title={`Edit ${active.name}`}
              >
                <Avatar member={active} size="sm" />
                <span className="hidden text-sm font-bold text-slate-900 sm:inline">
                  {active.name}
                </span>
              </button>
            )}
            {members.length === 0 && (
              <button
                type="button"
                onClick={() => {
                  setEditingMember(null);
                  setMemberModal(true);
                  setView("family");
                }}
                className="rounded-xl bg-sky-700 px-3 py-2 text-xs font-bold text-white sm:text-sm"
              >
                + Add member
              </button>
            )}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-xl bg-slate-200 px-3 py-2 text-xs font-bold text-slate-800 transition hover:bg-slate-300 sm:text-sm"
              title="Sign out"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Desktop nav */}
        <nav className="mb-5 hidden gap-2 sm:flex">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition ${
                view === item.id
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                  : "bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Main */}
        <main className="flex-1">
          {members.length === 0 && (
            <div className="card mb-6 border-sky-100 bg-gradient-to-br from-sky-50 to-white">
              <h2 className="text-xl font-bold text-slate-900">
                Welcome — set up your family
              </h2>
              <p className="mt-2 max-w-xl text-sm text-slate-600">
                This calendar starts empty. Add family members, then events,
                chores, and fitness. Connect Google or Outlook under{" "}
                <strong>Family</strong> when you&apos;re ready.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingMember(null);
                  setMemberModal(true);
                  setView("family");
                }}
                className="mt-4 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-600/20"
              >
                + Add first family member
              </button>
            </div>
          )}
          {view === "today" && (
            <TodayHub
              onAddEvent={() => {
                if (members.length === 0) {
                  setView("family");
                  setMemberModal(true);
                  return;
                }
                setEditingEvent(null);
                setEventDefaultDate(undefined);
                setEventModal(true);
              }}
              onEditEvent={(e) => {
                setEditingEvent(e);
                setEventModal(true);
              }}
              onAddChore={() => {
                if (members.length === 0) {
                  setView("family");
                  setMemberModal(true);
                  return;
                }
                setEditingChore(null);
                setChoreModal(true);
              }}
              onAddFitness={() => {
                if (members.length === 0) {
                  setView("family");
                  setMemberModal(true);
                  return;
                }
                setFitnessModal(true);
              }}
              onNavigate={(v) => setView(v)}
            />
          )}
          {view === "calendar" && (
            <CalendarView
              onAddEvent={(dateKey) => {
                setEditingEvent(null);
                setEventDefaultDate(dateKey);
                setEventModal(true);
              }}
              onEditEvent={(e) => {
                setEditingEvent(e);
                setEventModal(true);
              }}
            />
          )}
          {view === "chores" && (
            <ChoresView
              onAddChore={() => {
                setEditingChore(null);
                setChoreModal(true);
              }}
              onEditChore={(c) => {
                setEditingChore(c);
                setChoreModal(true);
              }}
            />
          )}
          {view === "fitness" && (
            <FitnessView
              onAddLog={() => setFitnessModal(true)}
              onCreateProgram={() => setProgramBuilderOpen(true)}
              onLogSession={(args) => setSessionLog(args)}
            />
          )}
          {view === "family" && (
            <FamilyView
              onAddMember={() => {
                setEditingMember(null);
                setMemberModal(true);
              }}
              onEditMember={(m) => {
                setEditingMember(m);
                setMemberModal(true);
              }}
              onConnect={(member, provider) => {
                setConnectMember(member);
                setConnectProvider(provider);
                setConnectOpen(true);
              }}
            />
          )}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-300 bg-white px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] sm:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-around">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-bold transition ${
                view === item.id
                  ? "bg-sky-100 text-sky-900"
                  : "text-slate-700"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Modals */}
      <EventModal
        open={eventModal}
        onClose={() => {
          setEventModal(false);
          setEditingEvent(null);
        }}
        event={editingEvent}
        defaultDate={eventDefaultDate}
      />
      <ChoreModal
        open={choreModal}
        onClose={() => {
          setChoreModal(false);
          setEditingChore(null);
        }}
        chore={editingChore}
      />
      <FitnessModal
        open={fitnessModal}
        onClose={() => setFitnessModal(false)}
      />
      <ProgramBuilderModal
        open={programBuilderOpen}
        onClose={() => setProgramBuilderOpen(false)}
      />
      <SessionLogModal
        open={!!sessionLog}
        onClose={() => setSessionLog(null)}
        memberId={sessionLog?.memberId ?? ""}
        programId={sessionLog?.programId ?? ""}
        day={sessionLog?.day ?? null}
      />
      <MemberModal
        open={memberModal}
        onClose={() => {
          setMemberModal(false);
          setEditingMember(null);
        }}
        member={editingMember}
      />
      <ConnectCalendarModal
        open={connectOpen}
        onClose={() => {
          setConnectOpen(false);
          setConnectMember(null);
          setConnectProvider(null);
        }}
        member={connectMember}
        provider={connectProvider}
      />
    </div>
  );
}
