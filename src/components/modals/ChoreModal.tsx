"use client";

import { useEffect, useState } from "react";
import { useFamilyStore } from "@/context/FamilyStore";
import { Modal, Field, inputClass, selectClass } from "@/components/ui/Modal";
import type { Chore, ChoreFrequency } from "@/lib/types";
import { toDateKey } from "@/lib/date-utils";

interface ChoreModalProps {
  open: boolean;
  onClose: () => void;
  chore?: Chore | null;
}

export function ChoreModal({ open, onClose, chore }: ChoreModalProps) {
  const { members, activeMemberId, addChore, updateChore, removeChore } =
    useFamilyStore();

  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState(toDateKey(new Date()));
  const [frequency, setFrequency] = useState<ChoreFrequency>("once");
  const [points, setPoints] = useState(5);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    if (chore) {
      setTitle(chore.title);
      setAssigneeId(chore.assigneeId);
      setDueDate(chore.dueDate);
      setFrequency(chore.frequency);
      setPoints(chore.points);
      setDescription(chore.description ?? "");
    } else {
      setTitle("");
      setAssigneeId(activeMemberId ?? members[0]?.id ?? "");
      setDueDate(toDateKey(new Date()));
      setFrequency("once");
      setPoints(5);
      setDescription("");
    }
  }, [open, chore, activeMemberId, members]);

  const handleSave = () => {
    if (!title.trim() || !assigneeId) return;
    const payload = {
      title: title.trim(),
      assigneeId,
      dueDate,
      frequency,
      points: Math.max(0, points),
      description: description.trim() || undefined,
    };
    if (chore) updateChore(chore.id, payload);
    else addChore(payload);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={chore ? "Edit chore" : "Add chore"}>
      <Field label="Chore">
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Take out trash"
          autoFocus
        />
      </Field>
      <Field label="Assigned to">
        <select
          className={selectClass}
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.avatarEmoji} {m.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Field label="Due date">
          <input
            type="date"
            className={inputClass}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </Field>
        <Field label="Points">
          <input
            type="number"
            min={0}
            className={inputClass}
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
          />
        </Field>
      </div>
      <Field label="Frequency">
        <select
          className={selectClass}
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as ChoreFrequency)}
        >
          <option value="once">One-time</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
      </Field>
      <Field label="Notes">
        <textarea
          className={`${inputClass} min-h-[80px] resize-none`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional"
        />
      </Field>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700"
        >
          {chore ? "Save changes" : "Add chore"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
        >
          Cancel
        </button>
        {chore && (
          <button
            type="button"
            onClick={() => {
              removeChore(chore.id);
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
