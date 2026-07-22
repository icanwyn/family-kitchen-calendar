"use client";

import { useEffect, useState } from "react";
import { useFamilyStore } from "@/context/FamilyStore";
import { Modal, Field, inputClass, selectClass } from "@/components/ui/Modal";
import type { Chore, ChoreFrequency } from "@/lib/types";
import { choreAssigneeIds } from "@/lib/types";
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
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [hasDueDate, setHasDueDate] = useState(true);
  const [dueDate, setDueDate] = useState(toDateKey(new Date()));
  const [frequency, setFrequency] = useState<ChoreFrequency>("once");
  const [points, setPoints] = useState(5);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    if (chore) {
      setTitle(chore.title);
      setAssigneeIds(choreAssigneeIds(chore));
      setHasDueDate(!!chore.dueDate);
      setDueDate(chore.dueDate || toDateKey(new Date()));
      setFrequency(chore.frequency);
      setPoints(chore.points);
      setDescription(chore.description ?? "");
    } else {
      setTitle("");
      setAssigneeIds(
        activeMemberId ? [activeMemberId] : members[0] ? [members[0].id] : []
      );
      setHasDueDate(true);
      setDueDate(toDateKey(new Date()));
      setFrequency("once");
      setPoints(5);
      setDescription("");
    }
  }, [open, chore, activeMemberId, members]);

  const toggleAssignee = (id: string) => {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (!title.trim() || assigneeIds.length === 0) return;
    const payload = {
      title: title.trim(),
      assigneeIds,
      assigneeId: assigneeIds[0],
      dueDate: hasDueDate && dueDate ? dueDate : undefined,
      frequency,
      points: Math.max(0, points),
      description: description.trim() || undefined,
    };
    if (chore) updateChore(chore.id, payload);
    else addChore(payload);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={chore ? "Edit chore / task" : "Add chore / task"}
    >
      <Field label="Title">
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Take out trash"
          autoFocus
        />
      </Field>

      <Field label="Assigned to (select one or more)">
        <div className="flex flex-wrap gap-2">
          {members.map((m) => {
            const on = assigneeIds.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleAssignee(m.id)}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold transition ${
                  on
                    ? "bg-emerald-600 text-white ring-2 ring-emerald-300"
                    : "bg-slate-100 text-slate-900 ring-1 ring-slate-300 hover:bg-slate-200"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-md text-xs ${
                    on ? "bg-white/20" : "bg-white ring-1 ring-slate-300"
                  }`}
                >
                  {on ? "✓" : ""}
                </span>
                {m.name}
              </button>
            );
          })}
        </div>
        {assigneeIds.length === 0 && (
          <p className="mt-1.5 text-xs font-semibold text-rose-600">
            Select at least one family member
          </p>
        )}
      </Field>

      <label className="mb-3 flex items-center gap-3 text-sm font-semibold text-slate-800">
        <input
          type="checkbox"
          checked={hasDueDate}
          onChange={(e) => setHasDueDate(e.target.checked)}
          className="h-5 w-5 rounded border-slate-300 text-emerald-600"
        />
        Has a due date
      </label>

      <div className="mb-4 grid grid-cols-2 gap-3">
        {hasDueDate ? (
          <Field label="Due date">
            <input
              type="date"
              className={inputClass}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>
        ) : (
          <div className="mb-4 rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
            No due date — open task / backlog
          </div>
        )}
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
          <option value="daily">Daily (resets each day)</option>
          <option value="weekly">Weekly (resets each week)</option>
          <option value="monthly">Monthly (resets each month)</option>
        </select>
        {frequency !== "once" && (
          <p className="mt-1.5 text-xs font-medium text-slate-600">
            When marked done, this chore opens again automatically at the start
            of the next {frequency === "daily" ? "day" : frequency === "weekly" ? "week" : "month"}.
          </p>
        )}
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
          disabled={!title.trim() || assigneeIds.length === 0}
          className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:opacity-40"
        >
          {chore ? "Save changes" : "Add chore / task"}
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
