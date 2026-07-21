/**
 * Evidence-based program generator.
 * Rules from ACSM/NSCA-aligned research brief:
 * - Major muscles ≥2×/week when days ≥3
 * - Hypertrophy ~8–12 reps, 90–150s rest compounds
 * - Strength 3–6 reps, 180–300s rest main lifts
 * - Beginners RIR 2–3, week-4 deload
 */

import { filterExercises, pickBest, GOALS } from "./exercises.js";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function priorityGoal(goals = []) {
  const order = ["strength", "hypertrophy", "fat_loss", "general_fitness"];
  for (const g of order) {
    if (goals.includes(g)) return g;
  }
  return "general_fitness";
}

function chooseSplit(days, experience, age, primaryGoal) {
  let d = clamp(days, 2, 6);
  if (experience === "beginner") d = Math.min(d, 4);
  if (age >= 65) d = Math.min(d, 4);

  if (age >= 60) {
    if (d <= 2) return { split: "full_body_ab", days: d };
    if (d === 3) return { split: "full_body_abc", days: 3 };
    return { split: "upper_lower", days: Math.min(d, 4) };
  }

  if (d === 2) return { split: "full_body_ab", days: 2 };
  if (d === 3) {
    if (primaryGoal === "hypertrophy" && experience !== "beginner") {
      return { split: "full_body_abc", days: 3 };
    }
    return { split: "full_body_abc", days: 3 };
  }
  if (d === 4) return { split: "upper_lower", days: 4 };
  if (d === 5) return { split: "upper_lower_full", days: 5 };
  if (experience === "beginner") return { split: "upper_lower", days: 4 };
  return { split: "ppl_x2", days: 6 };
}

function volumeBudget(experience, primaryGoal, age) {
  let base = { beginner: 8, intermediate: 12, advanced: 16 }[experience] || 8;
  if (primaryGoal === "strength") base -= 2;
  if (primaryGoal === "fat_loss" || primaryGoal === "general_fitness") base = Math.max(6, base - 2);
  if (age >= 60) base = Math.min(base, 12);
  if (experience === "beginner") base = Math.min(base, 10);
  return clamp(base, 4, 20);
}

function schemeFor(primaryGoal, compound, experience) {
  const beginner = experience === "beginner";
  if (primaryGoal === "strength") {
    if (compound) {
      return {
        sets: beginner ? 3 : 4,
        repMin: beginner ? 5 : 3,
        repMax: beginner ? 8 : 6,
        restSec: beginner ? 180 : 240,
        rir: beginner ? 3 : 2,
      };
    }
    return { sets: 2, repMin: 6, repMax: 10, restSec: 120, rir: 2 };
  }
  if (primaryGoal === "hypertrophy") {
    if (compound) {
      return {
        sets: beginner ? 3 : 3,
        repMin: 6,
        repMax: 12,
        restSec: 120,
        rir: beginner ? 3 : 2,
      };
    }
    return { sets: beginner ? 2 : 3, repMin: 8, repMax: 15, restSec: 75, rir: beginner ? 2 : 1 };
  }
  // fat_loss / general
  if (compound) {
    return { sets: 3, repMin: 8, repMax: 12, restSec: 75, rir: 3 };
  }
  return { sets: 2, repMin: 10, repMax: 15, restSec: 60, rir: 2 };
}

function deloadMultiplier(weekInBlock) {
  return { 1: 0.7, 2: 1.0, 3: 1.1, 4: 0.55 }[weekInBlock] || 1;
}

function sessionTemplates(split) {
  switch (split) {
    case "full_body_ab":
      return [
        { key: "A", title: "Full Body A", patterns: ["squat", "horiz_press", "horiz_pull", "hinge", "core"] },
        { key: "B", title: "Full Body B", patterns: ["hinge", "vert_press", "vert_pull", "squat", "core"] },
      ];
    case "full_body_abc":
      return [
        { key: "A", title: "Full Body A", patterns: ["squat", "horiz_press", "horiz_pull", "core"] },
        { key: "B", title: "Full Body B", patterns: ["hinge", "vert_press", "vert_pull", "core"] },
        { key: "C", title: "Full Body C", patterns: ["squat", "horiz_press", "horiz_pull", "hinge", "arms"] },
      ];
    case "upper_lower":
      return [
        { key: "U1", title: "Upper A", patterns: ["horiz_press", "horiz_pull", "vert_press", "vert_pull", "arms"] },
        { key: "L1", title: "Lower A", patterns: ["squat", "hinge", "core", "calves"] },
        { key: "U2", title: "Upper B", patterns: ["vert_press", "vert_pull", "horiz_press", "horiz_pull", "shoulders"] },
        { key: "L2", title: "Lower B", patterns: ["hinge", "squat", "core", "calves"] },
      ];
    case "upper_lower_full":
      return [
        { key: "U1", title: "Upper A", patterns: ["horiz_press", "horiz_pull", "vert_press", "arms"] },
        { key: "L1", title: "Lower A", patterns: ["squat", "hinge", "core"] },
        { key: "U2", title: "Upper B", patterns: ["vert_press", "vert_pull", "horiz_pull", "shoulders"] },
        { key: "L2", title: "Lower B", patterns: ["hinge", "squat", "calves"] },
        { key: "F", title: "Full Body Easy", patterns: ["squat", "horiz_press", "horiz_pull", "core"] },
      ];
    case "ppl_x2":
      return [
        { key: "P1", title: "Push A", patterns: ["horiz_press", "vert_press", "shoulders", "arms"] },
        { key: "Pu1", title: "Pull A", patterns: ["horiz_pull", "vert_pull", "arms", "core"] },
        { key: "L1", title: "Legs A", patterns: ["squat", "hinge", "calves", "core"] },
        { key: "P2", title: "Push B", patterns: ["vert_press", "horiz_press", "shoulders", "arms"] },
        { key: "Pu2", title: "Pull B", patterns: ["vert_pull", "horiz_pull", "arms", "core"] },
        { key: "L2", title: "Legs B", patterns: ["hinge", "squat", "calves", "core"] },
      ];
    default:
      return sessionTemplates("full_body_abc");
  }
}

function buildExercisesForSession(template, pool, primaryGoal, experience, age, volMul) {
  const used = new Set();
  const exercises = [];
  const patterns = template.patterns;

  for (const pattern of patterns) {
    let ex = pickBest(pool, pattern, used);
    // Fallback patterns for missing vertical pull etc.
    if (!ex && pattern === "vert_pull") ex = pickBest(pool, "horiz_pull", used);
    if (!ex && pattern === "vert_press") ex = pickBest(pool, "horiz_press", used);
    if (!ex && pattern === "shoulders") ex = pickBest(pool, "vert_press", used);
    if (!ex && pattern === "arms") {
      ex = pickBest(pool, "arms", used);
    }
    if (!ex && pattern === "calves") ex = pickBest(pool, "calves", used);
    if (!ex) continue;

    used.add(ex.id);
    const scheme = schemeFor(primaryGoal, ex.compound, experience);
    let sets = Math.max(1, Math.round(scheme.sets * volMul));
    if (age >= 60) sets = Math.min(sets, 3);

    // Optional second accessory for main compounds on hypertrophy intermediate+
    exercises.push({
      exerciseId: ex.id,
      name: ex.name,
      pattern: ex.pattern,
      sets,
      repMin: scheme.repMin,
      repMax: scheme.repMax,
      repsLabel: `${scheme.repMin}–${scheme.repMax}`,
      restSec: scheme.restSec,
      rir: scheme.rir,
      cues: ex.cues,
      compound: ex.compound,
    });

    // Add accessory for key patterns on longer sessions
    if (
      (pattern === "squat" || pattern === "horiz_press" || pattern === "horiz_pull") &&
      experience !== "beginner" &&
      primaryGoal === "hypertrophy"
    ) {
      const acc = pickBest(pool, pattern, used);
      if (acc && !acc.compound) {
        used.add(acc.id);
        const s2 = schemeFor(primaryGoal, false, experience);
        exercises.push({
          exerciseId: acc.id,
          name: acc.name,
          pattern: acc.pattern,
          sets: Math.max(1, Math.round(s2.sets * volMul)),
          repMin: s2.repMin,
          repMax: s2.repMax,
          repsLabel: `${s2.repMin}–${s2.repMax}`,
          restSec: s2.restSec,
          rir: s2.rir,
          cues: acc.cues,
          compound: false,
        });
      }
    }
  }

  // Ensure core if missing and age 60+
  if (age >= 60 && !exercises.some((e) => e.pattern === "core")) {
    const core = pickBest(pool, "core", used);
    if (core) {
      exercises.push({
        exerciseId: core.id,
        name: core.name,
        pattern: "core",
        sets: 2,
        repMin: 8,
        repMax: 12,
        repsLabel: "8–12 / 20–40s",
        restSec: 60,
        rir: 3,
        cues: core.cues,
        compound: false,
      });
    }
  }

  // Balance finisher for 60+
  if (age >= 60 && exercises.length < 8) {
    exercises.push({
      exerciseId: "balance_stand",
      name: "Single-Leg Balance",
      pattern: "core",
      sets: 2,
      repMin: 20,
      repMax: 30,
      repsLabel: "20–30s/side",
      restSec: 30,
      rir: 4,
      cues: "Hold near a wall if needed. Soft knee.",
      compound: false,
    });
  }

  return exercises;
}

function estimateMinutes(exercises) {
  // ~45s work + rest per set + warm/cool
  let sec = 8 * 60; // warm
  for (const e of exercises) {
    const perSet = 45 + (e.restSec || 90);
    sec += e.sets * perSet;
  }
  sec += 4 * 60; // cool
  return Math.round(sec / 60);
}

function assignWeekdays(rtCount) {
  // Prefer Mon-spaced patterns
  const maps = {
    2: [1, 4], // Mon Thu
    3: [1, 3, 5], // M W F
    4: [1, 2, 4, 5], // M T Th F
    5: [1, 2, 3, 5, 6],
    6: [1, 2, 3, 4, 5, 6],
  };
  return maps[rtCount] || maps[3];
}

function startOfWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 Sun
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Generate a 4-week personalized program.
 * @param {object} profile
 */
function toMetric(profile) {
  const units = profile.units || "metric";
  let weight = Number(profile.weight) || 70;
  let height = Number(profile.height) || 170;
  if (units === "imperial") {
    weight = weight * 0.453592; // lb → kg
    height = height * 2.54; // in → cm
  }
  return { weightKg: weight, heightCm: height };
}

export function generateProgram(profile) {
  const age = Number(profile.age) || 30;
  const goals = profile.goals?.length ? profile.goals : ["general_fitness"];
  const equipment = profile.equipment?.length ? profile.equipment : ["bodyweight"];
  const experience = profile.experience || "beginner";
  const daysPerWeek = Number(profile.daysPerWeek) || 3;
  const primaryGoal = priorityGoal(goals);
  const { weightKg, heightCm } = toMetric(profile);
  const bmi = weightKg / ((heightCm / 100) ** 2);

  const { split, days: rtDays } = chooseSplit(daysPerWeek, experience, age, primaryGoal);
  const weeklySets = volumeBudget(experience, primaryGoal, age);
  const templates = sessionTemplates(split);
  const pool = filterExercises(equipment, { age, experience });
  const weekdays = assignWeekdays(rtDays);
  const wantCardio = goals.includes("fat_loss") || goals.includes("general_fitness");

  const weeks = [];
  const anchor = startOfWeek(new Date());

  for (let w = 0; w < 4; w++) {
    const weekInBlock = w + 1;
    const volMul = deloadMultiplier(weekInBlock);
    const isDeload = weekInBlock === 4;
    const weekStart = addDays(anchor, w * 7);
    const days = [];

    // Build 7 calendar days Mon-Sun (index 0 = Monday)
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const jsDay = date.getDay(); // 0 Sun ... 6 Sat
      const dateStr = isoDate(date);
      const rtIndex = weekdays.indexOf(jsDay);

      if (rtIndex >= 0) {
        const template = templates[rtIndex % templates.length];
        const exercises = buildExercisesForSession(
          template,
          pool,
          primaryGoal,
          experience,
          age,
          volMul
        );
        const minutes = estimateMinutes(exercises);
        days.push({
          id: `w${weekInBlock}-d${dateStr}`,
          date: dateStr,
          dayName: DAY_NAMES[jsDay],
          type: "rt",
          title: isDeload ? `${template.title} (Deload)` : template.title,
          templateKey: template.key,
          exercises,
          estimatedMinutes: minutes,
          warmup: [
            "3–5 min easy walk or march in place",
            "Arm circles, hip hinges, bodyweight squats × 8",
            "1–2 light ramp sets on first compound",
          ],
          cooldown: ["2–3 min easy walk", "Optional gentle stretch 20–30s tight areas"],
          notes:
            primaryGoal === "strength"
              ? "Rest fully between heavy sets. Leave 2–3 reps in reserve."
              : primaryGoal === "hypertrophy"
                ? "Move with control. Last few reps should feel hard but clean."
                : "Keep a steady pace. Consistency beats intensity this week.",
          deload: isDeload,
        });
      } else if (wantCardio && (jsDay === 2 || jsDay === 6) && weekdays.indexOf(jsDay) < 0) {
        // Tue or Sat cardio if free
        const mins = age >= 60 ? 25 : 30;
        days.push({
          id: `w${weekInBlock}-c${dateStr}`,
          date: dateStr,
          dayName: DAY_NAMES[jsDay],
          type: "cardio",
          title: age >= 60 || bmi >= 30
            ? "Zone 2 Walk"
            : "Zone 2 Cardio",
          exercises: [
            {
              exerciseId: "brisk_walk",
              name: "Brisk Walk or Easy Bike",
              pattern: "cardio",
              sets: 1,
              repMin: mins,
              repMax: mins,
              repsLabel: `${mins} min`,
              restSec: 0,
              rir: 4,
              cues: "You should be able to speak in short sentences.",
              compound: false,
            },
          ],
          estimatedMinutes: mins + 5,
          warmup: ["2 min easy pace"],
          cooldown: ["2 min slower pace"],
          notes: "Optional but helpful for recovery and fat-loss goals.",
          deload: false,
        });
      } else {
        days.push({
          id: `w${weekInBlock}-r${dateStr}`,
          date: dateStr,
          dayName: DAY_NAMES[jsDay],
          type: "rest",
          title: "Rest",
          exercises: [],
          estimatedMinutes: 0,
          warmup: [],
          cooldown: [],
          notes: "Sleep, walk lightly, hydrate. Recovery is training.",
          deload: false,
        });
      }
    }

    // If want cardio and no cardio day assigned, try to replace a rest day
    if (wantCardio && !days.some((d) => d.type === "cardio")) {
      const restIdx = days.findIndex((d) => d.type === "rest");
      if (restIdx >= 0) {
        const d = days[restIdx];
        days[restIdx] = {
          ...d,
          type: "cardio",
          title: "Zone 2 Walk",
          exercises: [
            {
              exerciseId: "brisk_walk",
              name: "Brisk Walk",
              pattern: "cardio",
              sets: 1,
              repMin: 25,
              repMax: 25,
              repsLabel: "25 min",
              restSec: 0,
              rir: 4,
              cues: "Conversational pace.",
              compound: false,
            },
          ],
          estimatedMinutes: 30,
          notes: "Light cardio on a recovery day.",
        };
      }
    }

    weeks.push({
      week: weekInBlock,
      startDate: isoDate(weekStart),
      deload: isDeload,
      volumeMultiplier: volMul,
      days,
    });
  }

  return {
    id: `prog_${Date.now()}`,
    createdAt: new Date().toISOString(),
    split,
    primaryGoal,
    primaryGoalLabel: GOALS[primaryGoal]?.label || primaryGoal,
    weeklySetsTarget: weeklySets,
    rtDaysPerWeek: rtDays,
    progressionRule: "double_progression",
    progressionNotes:
      "When you hit the top of the rep range on every set with good form, increase load next time (small jump). Otherwise add 1 rep.",
    profileSnapshot: {
      age,
      weight: profile.weight,
      height: profile.height,
      goals,
      equipment,
      experience,
      daysPerWeek: rtDays,
      name: profile.name,
    },
    weeks,
  };
}

export function getWeekIndexForDate(program, dateStr) {
  if (!program?.weeks?.length) return 0;
  for (let i = 0; i < program.weeks.length; i++) {
    if (program.weeks[i].days.some((d) => d.date === dateStr)) return i;
  }
  // If outside program, clamp to last or first
  const first = program.weeks[0].days[0]?.date;
  if (dateStr < first) return 0;
  return program.weeks.length - 1;
}

export function findDay(program, dateStr) {
  for (const week of program?.weeks || []) {
    const day = week.days.find((d) => d.date === dateStr);
    if (day) return { day, week };
  }
  return null;
}

export function todayISO() {
  return isoDate(new Date());
}
