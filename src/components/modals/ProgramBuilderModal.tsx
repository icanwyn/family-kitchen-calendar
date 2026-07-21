"use client";

import { useEffect, useState } from "react";
import { useFamilyStore } from "@/context/FamilyStore";
import { Modal, Field, inputClass, selectClass } from "@/components/ui/Modal";
import { generateProgram } from "@/lib/fitness/programGenerator.js";
import {
  EQUIPMENT,
  GOALS,
  EXPERIENCE,
} from "@/lib/fitness/exercises.js";
import type { WorkoutProgram } from "@/lib/types";
import { uid } from "@/lib/date-utils";

interface ProgramBuilderModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (program: WorkoutProgram) => void;
}

type GoalId = keyof typeof GOALS;
type EquipId = keyof typeof EQUIPMENT;
type ExpId = keyof typeof EXPERIENCE;

export function ProgramBuilderModal({
  open,
  onClose,
  onCreated,
}: ProgramBuilderModalProps) {
  const { members, activeMemberId, addWorkoutProgram } = useFamilyStore();

  const [step, setStep] = useState(0);
  const [memberId, setMemberId] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("35");
  const [weight, setWeight] = useState("160");
  const [height, setHeight] = useState("68");
  const [units, setUnits] = useState<"imperial" | "metric">("imperial");
  const [experience, setExperience] = useState<ExpId>("beginner");
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [goals, setGoals] = useState<GoalId[]>(["general_fitness"]);
  const [equipment, setEquipment] = useState<EquipId[]>(["bodyweight"]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setError("");
    const m = members.find((x) => x.id === activeMemberId) ?? members[0];
    setMemberId(m?.id ?? "");
    setName(m?.name ?? "");
    setAge("35");
    setWeight("160");
    setHeight("68");
    setUnits("imperial");
    setExperience("beginner");
    setDaysPerWeek(3);
    setGoals(["general_fitness"]);
    setEquipment(["bodyweight"]);
  }, [open, members, activeMemberId]);

  const toggleGoal = (g: GoalId) => {
    setGoals((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  const toggleEquip = (e: EquipId) => {
    setEquipment((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]
    );
  };

  const generate = () => {
    if (!memberId) {
      setError("Choose a family member for this program.");
      return;
    }
    if (goals.length === 0) {
      setError("Pick at least one goal.");
      return;
    }
    if (equipment.length === 0) {
      setError("Pick at least one equipment option.");
      return;
    }
    setError("");
    try {
      const raw = generateProgram({
        name: name.trim() || members.find((m) => m.id === memberId)?.name,
        age: Number(age) || 30,
        weight: Number(weight) || (units === "imperial" ? 160 : 70),
        height: Number(height) || (units === "imperial" ? 68 : 170),
        units,
        goals,
        equipment,
        experience,
        daysPerWeek,
      });
      const program = {
        ...raw,
        id: uid("wp"),
        memberId,
        name:
          name.trim() ||
          `${raw.primaryGoalLabel} · ${raw.rtDaysPerWeek} days/week`,
        active: true,
      } as WorkoutProgram;
      addWorkoutProgram(program);
      onCreated?.(program);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build program");
    }
  };

  if (members.length === 0) {
    return (
      <Modal open={open} onClose={onClose} title="Create training program">
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
          Add a family member on the Family tab first.
        </p>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Create training program" wide>
      <p className="mb-4 text-sm font-medium text-slate-700">
        Mori-style 4-week plan: personalized split, sets, reps, and rest —
        based on goals, experience, and equipment.
      </p>

      {/* Steps */}
      <div className="mb-5 flex gap-2">
        {["Who", "Body", "Goals", "Equipment"].map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(i)}
            className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
              step === i
                ? "bg-violet-700 text-white"
                : "bg-slate-100 text-slate-700 ring-1 ring-slate-300"
            }`}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {step === 0 && (
        <>
          <Field label="Family member">
            <select
              className={selectClass}
              value={memberId}
              onChange={(e) => {
                setMemberId(e.target.value);
                const m = members.find((x) => x.id === e.target.value);
                if (m) setName(m.name);
              }}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Program label (optional)">
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Spring strength block"
            />
          </Field>
          <Field label="Experience">
            <div className="grid gap-2 sm:grid-cols-3">
              {(Object.keys(EXPERIENCE) as ExpId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setExperience(id)}
                  className={`rounded-xl px-3 py-3 text-left text-sm transition ${
                    experience === id
                      ? "bg-violet-700 text-white"
                      : "bg-slate-100 text-slate-900 ring-1 ring-slate-300"
                  }`}
                >
                  <span className="font-bold">{EXPERIENCE[id].label}</span>
                  <span
                    className={`mt-0.5 block text-xs ${
                      experience === id ? "text-violet-100" : "text-slate-600"
                    }`}
                  >
                    {EXPERIENCE[id].desc}
                  </span>
                </button>
              ))}
            </div>
          </Field>
          <Field label="Training days per week">
            <div className="flex flex-wrap gap-2">
              {[2, 3, 4, 5, 6].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDaysPerWeek(d)}
                  className={`h-11 w-11 rounded-xl text-sm font-bold ${
                    daysPerWeek === d
                      ? "bg-violet-700 text-white"
                      : "bg-slate-100 text-slate-900 ring-1 ring-slate-300"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </Field>
        </>
      )}

      {step === 1 && (
        <>
          <Field label="Units">
            <div className="flex gap-2">
              {(
                [
                  ["imperial", "lb / in"],
                  ["metric", "kg / cm"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setUnits(id)}
                  className={`rounded-xl px-4 py-2 text-sm font-bold ${
                    units === id
                      ? "bg-violet-700 text-white"
                      : "bg-slate-100 text-slate-900 ring-1 ring-slate-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Age">
              <input
                type="number"
                min={12}
                max={100}
                className={inputClass}
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </Field>
            <Field label={units === "imperial" ? "Weight (lb)" : "Weight (kg)"}>
              <input
                type="number"
                min={1}
                className={inputClass}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </Field>
            <Field label={units === "imperial" ? "Height (in)" : "Height (cm)"}>
              <input
                type="number"
                min={1}
                className={inputClass}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </Field>
          </div>
        </>
      )}

      {step === 2 && (
        <Field label="Goals (pick one or more)">
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(GOALS) as GoalId[]).map((id) => {
              const on = goals.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleGoal(id)}
                  className={`rounded-xl px-3 py-3 text-left text-sm transition ${
                    on
                      ? "bg-violet-700 text-white ring-2 ring-violet-400"
                      : "bg-slate-100 text-slate-900 ring-1 ring-slate-300"
                  }`}
                >
                  <span className="font-bold">{GOALS[id].label}</span>
                  <span
                    className={`mt-0.5 block text-xs ${
                      on ? "text-violet-100" : "text-slate-600"
                    }`}
                  >
                    {GOALS[id].desc}
                  </span>
                </button>
              );
            })}
          </div>
        </Field>
      )}

      {step === 3 && (
        <Field label="Equipment available">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(EQUIPMENT) as EquipId[]).map((id) => {
              const on = equipment.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleEquip(id)}
                  className={`rounded-full px-3 py-2 text-sm font-bold transition ${
                    on
                      ? "bg-violet-700 text-white"
                      : "bg-slate-100 text-slate-900 ring-1 ring-slate-300"
                  }`}
                >
                  {EQUIPMENT[id].label}
                </button>
              );
            })}
          </div>
        </Field>
      )}

      {error && (
        <p className="mt-3 rounded-xl bg-rose-100 px-3 py-2 text-sm font-bold text-rose-800">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="rounded-xl bg-slate-200 px-4 py-3 text-sm font-bold text-slate-900"
          >
            Back
          </button>
        )}
        {step < 3 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={generate}
            className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-700/25"
          >
            Generate 4-week program
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}
