"use client";

import { useEffect, useState } from "react";
import { useFamilyStore } from "@/context/FamilyStore";
import { Modal, Field, inputClass, selectClass } from "@/components/ui/Modal";
import type { FitnessActivityType, FitnessProgram } from "@/lib/types";
import { ACTIVITY_EMOJIS, ACTIVITY_LABELS, MEMBER_COLORS } from "@/lib/types";

interface ProgramModalProps {
  open: boolean;
  onClose: () => void;
  program?: FitnessProgram | null;
}

const ALL_TYPES = Object.keys(ACTIVITY_LABELS) as FitnessActivityType[];

export function ProgramModal({ open, onClose, program }: ProgramModalProps) {
  const {
    members,
    activeMemberId,
    addFitnessProgram,
    updateFitnessProgram,
    removeFitnessProgram,
  } = useFamilyStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [memberId, setMemberId] = useState("");
  const [weeklyGoalSessions, setWeeklyGoalSessions] = useState(3);
  const [weeklyGoalMinutes, setWeeklyGoalMinutes] = useState(120);
  const [activityTypes, setActivityTypes] = useState<FitnessActivityType[]>([
    "run",
  ]);
  const [color, setColor] = useState<string>(MEMBER_COLORS[0]);

  useEffect(() => {
    if (!open) return;
    if (program) {
      setName(program.name);
      setDescription(program.description ?? "");
      setMemberId(program.memberId);
      setWeeklyGoalSessions(program.weeklyGoalSessions);
      setWeeklyGoalMinutes(program.weeklyGoalMinutes);
      setActivityTypes(program.activityTypes);
      setColor(program.color);
    } else {
      const m = members.find((x) => x.id === activeMemberId) ?? members[0];
      setName("");
      setDescription("");
      setMemberId(m?.id ?? "");
      setWeeklyGoalSessions(3);
      setWeeklyGoalMinutes(120);
      setActivityTypes(["run"]);
      setColor(m?.color ?? MEMBER_COLORS[0]);
    }
  }, [open, program, activeMemberId, members]);

  const toggleType = (t: FitnessActivityType) => {
    setActivityTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const handleSave = () => {
    if (!name.trim() || !memberId || activityTypes.length === 0) return;
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      memberId,
      weeklyGoalSessions,
      weeklyGoalMinutes,
      activityTypes,
      color,
      active: true,
    };
    if (program) updateFitnessProgram(program.id, payload);
    else addFitnessProgram(payload);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={program ? "Edit program" : "New fitness program"}
    >
      <Field label="Program name">
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. 5K Training"
          autoFocus
        />
      </Field>
      <Field label="Who">
        <select
          className={selectClass}
          value={memberId}
          onChange={(e) => {
            setMemberId(e.target.value);
            const m = members.find((x) => x.id === e.target.value);
            if (m) setColor(m.color);
          }}
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.avatarEmoji} {m.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Description">
        <input
          className={inputClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional goal"
        />
      </Field>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Field label="Sessions / week">
          <input
            type="number"
            min={1}
            className={inputClass}
            value={weeklyGoalSessions}
            onChange={(e) => setWeeklyGoalSessions(Number(e.target.value))}
          />
        </Field>
        <Field label="Minutes / week">
          <input
            type="number"
            min={1}
            className={inputClass}
            value={weeklyGoalMinutes}
            onChange={(e) => setWeeklyGoalMinutes(Number(e.target.value))}
          />
        </Field>
      </div>
      <Field label="Activities">
        <div className="flex flex-wrap gap-2">
          {ALL_TYPES.map((t) => {
            const on = activityTypes.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleType(t)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  on
                    ? "bg-violet-100 text-violet-800 ring-2 ring-violet-300"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {ACTIVITY_EMOJIS[t]} {ACTIVITY_LABELS[t]}
              </button>
            );
          })}
        </div>
      </Field>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-700"
        >
          {program ? "Save" : "Create program"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
        >
          Cancel
        </button>
        {program && (
          <button
            type="button"
            onClick={() => {
              removeFitnessProgram(program.id);
              onClose();
            }}
            className="ml-auto rounded-xl px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
          >
            Delete
          </button>
        )}
      </div>
    </Modal>
  );
}
