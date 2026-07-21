"use client";

import { useEffect, useState } from "react";
import { useFamilyStore } from "@/context/FamilyStore";
import { Modal, Field, inputClass, selectClass } from "@/components/ui/Modal";
import type { FitnessActivityType } from "@/lib/types";
import { ACTIVITY_EMOJIS, ACTIVITY_LABELS } from "@/lib/types";
import { toDateKey } from "@/lib/date-utils";

interface FitnessModalProps {
  open: boolean;
  onClose: () => void;
}

export function FitnessModal({ open, onClose }: FitnessModalProps) {
  const { members, activeMemberId, fitnessPrograms, addFitnessLog } =
    useFamilyStore();

  const [memberId, setMemberId] = useState("");
  const [activityType, setActivityType] = useState<FitnessActivityType>("run");
  const [title, setTitle] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [distanceMiles, setDistanceMiles] = useState("");
  const [calories, setCalories] = useState("");
  const [date, setDate] = useState(toDateKey(new Date()));
  const [programId, setProgramId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setMemberId(activeMemberId ?? members[0]?.id ?? "");
    setActivityType("run");
    setTitle("");
    setDurationMinutes(30);
    setDistanceMiles("");
    setCalories("");
    setDate(toDateKey(new Date()));
    setProgramId("");
    setNotes("");
  }, [open, activeMemberId, members]);

  const memberPrograms = fitnessPrograms.filter(
    (p) => p.memberId === memberId && p.active
  );

  const handleSave = () => {
    if (!memberId || durationMinutes <= 0) return;
    const label = ACTIVITY_LABELS[activityType];
    addFitnessLog({
      memberId,
      activityType,
      title: title.trim() || label,
      durationMinutes,
      distanceMiles: distanceMiles ? Number(distanceMiles) : undefined,
      calories: calories ? Number(calories) : undefined,
      date,
      programId: programId || undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Log workout">
      <Field label="Who">
        <select
          className={selectClass}
          value={memberId}
          onChange={(e) => {
            setMemberId(e.target.value);
            setProgramId("");
          }}
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.avatarEmoji} {m.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Activity">
        <select
          className={selectClass}
          value={activityType}
          onChange={(e) => setActivityType(e.target.value as FitnessActivityType)}
        >
          {(Object.keys(ACTIVITY_LABELS) as FitnessActivityType[]).map((k) => (
            <option key={k} value={k}>
              {ACTIVITY_EMOJIS[k]} {ACTIVITY_LABELS[k]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Title">
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={`${ACTIVITY_LABELS[activityType]} session`}
        />
      </Field>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <Field label="Minutes">
          <input
            type="number"
            min={1}
            className={inputClass}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
          />
        </Field>
        <Field label="Miles">
          <input
            type="number"
            min={0}
            step={0.1}
            className={inputClass}
            value={distanceMiles}
            onChange={(e) => setDistanceMiles(e.target.value)}
            placeholder="—"
          />
        </Field>
        <Field label="Calories">
          <input
            type="number"
            min={0}
            className={inputClass}
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            placeholder="—"
          />
        </Field>
      </div>
      <Field label="Date">
        <input
          type="date"
          className={inputClass}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </Field>
      {memberPrograms.length > 0 && (
        <Field label="Program">
          <select
            className={selectClass}
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
          >
            <option value="">None</option>
            {memberPrograms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Notes">
        <textarea
          className={`${inputClass} min-h-[70px] resize-none`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did it feel?"
        />
      </Field>
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-700"
        >
          Log workout
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}
