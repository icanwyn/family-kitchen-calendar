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
  defaultActivity?: FitnessActivityType;
}

export function FitnessModal({
  open,
  onClose,
  defaultActivity = "walk",
}: FitnessModalProps) {
  const { members, activeMemberId, addFitnessLog } = useFamilyStore();

  const [memberId, setMemberId] = useState("");
  const [activityType, setActivityType] =
    useState<FitnessActivityType>(defaultActivity);
  const [title, setTitle] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [distanceMiles, setDistanceMiles] = useState("");
  const [steps, setSteps] = useState("");
  const [calories, setCalories] = useState("");
  const [date, setDate] = useState(toDateKey(new Date()));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setMemberId(activeMemberId ?? members[0]?.id ?? "");
    setActivityType(defaultActivity);
    setTitle("");
    setDurationMinutes(defaultActivity === "steps" ? 0 : 30);
    setDistanceMiles("");
    setSteps("");
    setCalories("");
    setDate(toDateKey(new Date()));
    setNotes("");
    setError("");
  }, [open, activeMemberId, members, defaultActivity]);

  const handleSave = () => {
    if (members.length === 0) {
      setError("Add a family member first.");
      return;
    }
    if (!memberId) {
      setError("Choose who did this activity.");
      return;
    }
    const isSteps = activityType === "steps";
    if (!isSteps && (!durationMinutes || durationMinutes <= 0)) {
      setError("Enter minutes greater than 0.");
      return;
    }
    if (isSteps && !steps && durationMinutes <= 0) {
      setError("Enter steps or minutes.");
      return;
    }
    const label = ACTIVITY_LABELS[activityType];
    addFitnessLog({
      memberId,
      activityType,
      title: title.trim() || label,
      durationMinutes: durationMinutes || 0,
      distanceMiles: distanceMiles ? Number(distanceMiles) : undefined,
      steps: steps ? Number(steps) : undefined,
      calories: calories ? Number(calories) : undefined,
      date,
      notes: notes.trim() || undefined,
      source: "activity",
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log activity"
      panelClassName="mori-modal-skin"
    >
      {members.length === 0 ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
          Add a family member on the Family tab before logging.
        </p>
      ) : (
        <>
          <Field label="Who">
            <select
              className={selectClass}
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Activity">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(Object.keys(ACTIVITY_LABELS) as FitnessActivityType[]).map(
                (k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setActivityType(k)}
                    className={`rounded-xl px-2 py-2.5 text-sm font-bold transition ${
                      activityType === k
                        ? "bg-violet-700 text-white ring-2 ring-violet-400"
                        : "bg-slate-100 text-slate-900 ring-1 ring-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    {ACTIVITY_EMOJIS[k]} {ACTIVITY_LABELS[k]}
                  </button>
                )
              )}
            </div>
          </Field>

          <Field label="Title (optional)">
            <input
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`${ACTIVITY_LABELS[activityType]} session`}
            />
          </Field>

          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Minutes">
              <input
                type="number"
                min={0}
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
            <Field label="Steps">
              <input
                type="number"
                min={0}
                className={inputClass}
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
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

          <Field label="Notes">
            <textarea
              className={`${inputClass} min-h-[70px] resize-none`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did it feel?"
            />
          </Field>

          {error && (
            <p className="mb-3 rounded-xl bg-rose-100 px-3 py-2 text-sm font-bold text-rose-800">
              {error}
            </p>
          )}

          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-700/25 transition hover:bg-violet-800"
            >
              Save activity
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-200 px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-300"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
