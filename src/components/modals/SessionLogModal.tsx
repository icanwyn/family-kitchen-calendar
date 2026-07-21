"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useFamilyStore } from "@/context/FamilyStore";
import type {
  FitnessExerciseLog,
  FitnessSetLog,
  WorkoutProgramDay,
} from "@/lib/types";

interface SessionLogModalProps {
  open: boolean;
  onClose: () => void;
  memberId: string;
  programId: string;
  day: WorkoutProgramDay | null;
}

export function SessionLogModal({
  open,
  onClose,
  memberId,
  programId,
  day,
}: SessionLogModalProps) {
  const { addFitnessLog } = useFamilyStore();
  const [exerciseLogs, setExerciseLogs] = useState<FitnessExerciseLog[]>([]);
  const [notes, setNotes] = useState("");
  const [exIndex, setExIndex] = useState(0);

  useEffect(() => {
    if (!open || !day) return;
    setNotes("");
    setExIndex(0);
    setExerciseLogs(
      day.exercises.map((e) => ({
        exerciseId: e.exerciseId,
        name: e.name,
        sets: Array.from({ length: e.sets }, (): FitnessSetLog => ({
          reps: e.repMin,
          weight: undefined,
          done: false,
        })),
      }))
    );
  }, [open, day]);

  if (!day) return null;

  const current = exerciseLogs[exIndex];
  const planned = day.exercises[exIndex];
  const durationGuess = day.estimatedMinutes || 45;

  const updateSet = (
    ei: number,
    si: number,
    patch: Partial<FitnessSetLog>
  ) => {
    setExerciseLogs((prev) =>
      prev.map((ex, i) =>
        i !== ei
          ? ex
          : {
              ...ex,
              sets: ex.sets.map((s, j) =>
                j === si ? { ...s, ...patch } : s
              ),
            }
      )
    );
  };

  const save = () => {
    addFitnessLog({
      memberId,
      activityType: day.type === "cardio" ? "walk" : "strength",
      title: day.title,
      durationMinutes: durationGuess,
      date: day.date,
      notes: notes.trim() || undefined,
      source: "program",
      programId,
      sessionDayId: day.id,
      exerciseLogs,
    });
    onClose();
  };

  const doneSets = exerciseLogs.reduce(
    (n, e) => n + e.sets.filter((s) => s.done).length,
    0
  );
  const totalSets = exerciseLogs.reduce((n, e) => n + e.sets.length, 0);

  return (
    <Modal open={open} onClose={onClose} title={day.title} wide>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-slate-700">
        <span>
          {day.dayName} · {day.date} · ~{durationGuess} min
        </span>
        <span className="rounded-full bg-violet-100 px-3 py-1 text-violet-900">
          {doneSets}/{totalSets} sets checked
        </span>
      </div>

      {day.warmup && day.warmup.length > 0 && (
        <div className="mb-4 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800">
          <p className="font-bold">Warm-up</p>
          <ul className="mt-1 list-disc pl-5">
            {day.warmup.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {day.exercises.length === 0 ? (
        <p className="py-6 text-center font-semibold text-slate-700">
          Rest day — no lifts to log. Enjoy recovery.
        </p>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-1">
            {day.exercises.map((e, i) => (
              <button
                key={e.exerciseId + i}
                type="button"
                onClick={() => setExIndex(i)}
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  i === exIndex
                    ? "bg-violet-700 text-white"
                    : "bg-slate-200 text-slate-800"
                }`}
              >
                {i + 1}. {e.name}
              </button>
            ))}
          </div>

          {current && planned && (
            <div className="rounded-2xl border border-slate-300 bg-white p-4">
              <h3 className="text-lg font-bold text-slate-900">
                {current.name}
              </h3>
              <p className="mt-1 text-sm font-medium text-slate-700">
                Target {planned.repsLabel} · {planned.sets} sets ·{" "}
                {planned.restSec >= 60
                  ? `${Math.round(planned.restSec / 60)} min rest`
                  : `${planned.restSec}s rest`}{" "}
                · RIR {planned.rir}
              </p>
              {planned.cues && (
                <p className="mt-2 text-sm text-slate-600">{planned.cues}</p>
              )}

              <div className="mt-4 space-y-2">
                {current.sets.map((set, si) => (
                  <div
                    key={si}
                    className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-2"
                  >
                    <span className="w-12 text-xs font-bold text-slate-600">
                      Set {si + 1}
                    </span>
                    <label className="flex items-center gap-1 text-sm font-semibold text-slate-800">
                      Reps
                      <input
                        type="number"
                        min={0}
                        className="w-16 rounded-lg border border-slate-300 px-2 py-1"
                        value={set.reps}
                        onChange={(e) =>
                          updateSet(exIndex, si, {
                            reps: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                    <label className="flex items-center gap-1 text-sm font-semibold text-slate-800">
                      Weight
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        className="w-20 rounded-lg border border-slate-300 px-2 py-1"
                        value={set.weight ?? ""}
                        placeholder="—"
                        onChange={(e) =>
                          updateSet(exIndex, si, {
                            weight: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        updateSet(exIndex, si, { done: !set.done })
                      }
                      className={`ml-auto rounded-lg px-3 py-1.5 text-xs font-bold ${
                        set.done
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-200 text-slate-800"
                      }`}
                    >
                      {set.done ? "Done ✓" : "Mark done"}
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  disabled={exIndex === 0}
                  onClick={() => setExIndex((i) => i - 1)}
                  className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-bold text-slate-900 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={exIndex >= day.exercises.length - 1}
                  onClick={() => setExIndex((i) => i + 1)}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
                >
                  Next exercise
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-semibold text-slate-800">
          Session notes
        </span>
        <textarea
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-900"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did it feel?"
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        {day.type !== "rest" && (
          <button
            type="button"
            onClick={save}
            className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white"
          >
            Save session
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-slate-200 px-5 py-3 text-sm font-bold text-slate-900"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
