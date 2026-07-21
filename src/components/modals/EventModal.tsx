"use client";

import { useEffect, useState } from "react";
import { useFamilyStore } from "@/context/FamilyStore";
import { Modal, Field, inputClass, selectClass } from "@/components/ui/Modal";
import type { CalendarEvent, EventCategory } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { combineDateAndTime, toDateKey } from "@/lib/date-utils";

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  defaultDate?: string;
}

export function EventModal({ open, onClose, event, defaultDate }: EventModalProps) {
  const { members, activeMemberId, addEvent, updateEvent, removeEvent } =
    useFamilyStore();

  const [title, setTitle] = useState("");
  const [memberId, setMemberId] = useState("");
  const [date, setDate] = useState(toDateKey(new Date()));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [allDay, setAllDay] = useState(false);
  const [category, setCategory] = useState<EventCategory>("general");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    if (event) {
      const start = new Date(event.start);
      const end = new Date(event.end);
      setTitle(event.title);
      setMemberId(event.memberId);
      setDate(toDateKey(start));
      setStartTime(
        `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`
      );
      setEndTime(
        `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`
      );
      setAllDay(event.allDay);
      setCategory(event.category);
      setLocation(event.location ?? "");
      setDescription(event.description ?? "");
    } else {
      setTitle("");
      setMemberId(activeMemberId ?? members[0]?.id ?? "");
      setDate(defaultDate ?? toDateKey(new Date()));
      setStartTime("09:00");
      setEndTime("10:00");
      setAllDay(false);
      setCategory("general");
      setLocation("");
      setDescription("");
    }
  }, [open, event, activeMemberId, members, defaultDate]);

  const handleSave = () => {
    if (!title.trim() || !memberId) return;
    const start = allDay
      ? combineDateAndTime(date, "00:00")
      : combineDateAndTime(date, startTime);
    const end = allDay
      ? combineDateAndTime(date, "23:59")
      : combineDateAndTime(date, endTime);

    const payload = {
      title: title.trim(),
      memberId,
      start,
      end,
      allDay,
      category,
      location: location.trim() || undefined,
      description: description.trim() || undefined,
      source: "local" as const,
    };

    if (event) updateEvent(event.id, payload);
    else addEvent(payload);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={event ? "Edit event" : "Add event"}>
      <Field label="Title">
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's happening?"
          autoFocus
        />
      </Field>
      <Field label="Who">
        <select
          className={selectClass}
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.avatarEmoji} {m.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Date">
        <input
          type="date"
          className={inputClass}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </Field>
      <label className="mb-4 flex items-center gap-3 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={allDay}
          onChange={(e) => setAllDay(e.target.checked)}
          className="h-5 w-5 rounded border-slate-300 text-sky-600"
        />
        All day
      </label>
      {!allDay && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          <Field label="Start">
            <input
              type="time"
              className={inputClass}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </Field>
          <Field label="End">
            <input
              type="time"
              className={inputClass}
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </Field>
        </div>
      )}
      <Field label="Category">
        <select
          className={selectClass}
          value={category}
          onChange={(e) => setCategory(e.target.value as EventCategory)}
        >
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Location">
        <input
          className={inputClass}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Optional"
        />
      </Field>
      <Field label="Notes">
        <textarea
          className={`${inputClass} min-h-[80px] resize-none`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional notes"
        />
      </Field>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-600/25 transition hover:bg-sky-700"
        >
          {event ? "Save changes" : "Add event"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
        >
          Cancel
        </button>
        {event && (
          <button
            type="button"
            onClick={() => {
              removeEvent(event.id);
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
