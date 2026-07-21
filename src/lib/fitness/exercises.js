/** Exercise library + goals (adapted from Mori workout). */

export const EQUIPMENT = {
  bodyweight: { id: "bodyweight", label: "Bodyweight" },
  dumbbells: { id: "dumbbells", label: "Dumbbells" },
  bands: { id: "bands", label: "Resistance bands" },
  barbell: { id: "barbell", label: "Barbell" },
  machines: { id: "machines", label: "Machines" },
  full_gym: { id: "full_gym", label: "Full gym" },
  pullup_bar: { id: "pullup_bar", label: "Pull-up bar" },
  kettlebell: { id: "kettlebell", label: "Kettlebell" },
  bench: { id: "bench", label: "Bench" },
};

export const GOALS = {
  hypertrophy: {
    id: "hypertrophy",
    label: "Muscle gain",
    desc: "Build size with controlled volume",
  },
  strength: {
    id: "strength",
    label: "Strength",
    desc: "Get stronger on big lifts",
  },
  fat_loss: {
    id: "fat_loss",
    label: "Fat loss",
    desc: "Retain muscle while leaning out",
  },
  general_fitness: {
    id: "general_fitness",
    label: "General fitness",
    desc: "Balanced health and energy",
  },
};

export const EXPERIENCE = {
  beginner: { id: "beginner", label: "Beginner", desc: "New to structured training" },
  intermediate: { id: "intermediate", label: "Intermediate", desc: "6+ months consistent" },
  advanced: { id: "advanced", label: "Advanced", desc: "2+ years of training" },
};

/**
 * @typedef {Object} Exercise
 * @property {string} id
 * @property {string} name
 * @property {string} pattern - squat | hinge | horiz_press | vert_press | horiz_pull | vert_pull | core | carry | cardio
 * @property {string[]} equipment
 * @property {boolean} compound
 * @property {number} ageSafe - 1-3 higher = safer for 60+
 * @property {number} skill - 1 beginner friendly, 3 advanced
 * @property {string} cues
 */

/** @type {Exercise[]} */
export const EXERCISES = [
  // Squat
  { id: "goblet_squat", name: "Goblet Squat", pattern: "squat", equipment: ["dumbbells", "kettlebell", "full_gym"], compound: true, ageSafe: 3, skill: 1, cues: "Chest up, elbows inside knees, sit between heels." },
  { id: "back_squat", name: "Back Squat", pattern: "squat", equipment: ["barbell", "full_gym"], compound: true, ageSafe: 2, skill: 2, cues: "Brace core, break at hips and knees together." },
  { id: "leg_press", name: "Leg Press", pattern: "squat", equipment: ["machines", "full_gym"], compound: true, ageSafe: 3, skill: 1, cues: "Full foot contact, do not lock knees hard." },
  { id: "bodyweight_squat", name: "Bodyweight Squat", pattern: "squat", equipment: ["bodyweight"], compound: true, ageSafe: 3, skill: 1, cues: "Sit back, knees track over toes." },
  { id: "split_squat", name: "Split Squat", pattern: "squat", equipment: ["bodyweight", "dumbbells", "full_gym"], compound: true, ageSafe: 2, skill: 2, cues: "Tall torso, front knee tracks over mid-foot." },
  { id: "db_lunge", name: "Dumbbell Reverse Lunge", pattern: "squat", equipment: ["dumbbells", "full_gym"], compound: true, ageSafe: 2, skill: 2, cues: "Step back softly, front shin vertical." },
  { id: "band_squat", name: "Band Squat", pattern: "squat", equipment: ["bands"], compound: true, ageSafe: 3, skill: 1, cues: "Stand on band, drive up against tension." },
  { id: "box_squat", name: "Box Squat", pattern: "squat", equipment: ["bodyweight", "dumbbells", "barbell", "full_gym"], compound: true, ageSafe: 3, skill: 1, cues: "Sit to a stable box, stand with control." },

  // Hinge
  { id: "db_rdl", name: "Dumbbell Romanian Deadlift", pattern: "hinge", equipment: ["dumbbells", "full_gym"], compound: true, ageSafe: 3, skill: 1, cues: "Soft knees, push hips back, flat back." },
  { id: "barbell_rdl", name: "Barbell Romanian Deadlift", pattern: "hinge", equipment: ["barbell", "full_gym"], compound: true, ageSafe: 2, skill: 2, cues: "Bar close to legs, hinge until hamstrings stretch." },
  { id: "trap_bar_dl", name: "Trap Bar Deadlift", pattern: "hinge", equipment: ["full_gym"], compound: true, ageSafe: 3, skill: 2, cues: "Neutral spine, drive floor away." },
  { id: "hip_thrust", name: "Hip Thrust", pattern: "hinge", equipment: ["bodyweight", "dumbbells", "barbell", "bench", "full_gym"], compound: true, ageSafe: 3, skill: 1, cues: "Chin tucked, squeeze glutes at top." },
  { id: "band_hinge", name: "Band Good Morning", pattern: "hinge", equipment: ["bands"], compound: true, ageSafe: 3, skill: 1, cues: "Band over shoulders, hinge with soft knees." },
  { id: "glute_bridge", name: "Glute Bridge", pattern: "hinge", equipment: ["bodyweight"], compound: true, ageSafe: 3, skill: 1, cues: "Press through heels, pause at top." },

  // Horizontal press
  { id: "db_bench", name: "Dumbbell Bench Press", pattern: "horiz_press", equipment: ["dumbbells", "bench", "full_gym"], compound: true, ageSafe: 3, skill: 1, cues: "Wrists stacked, lower with control." },
  { id: "db_floor_press", name: "Dumbbell Floor Press", pattern: "horiz_press", equipment: ["dumbbells", "full_gym"], compound: true, ageSafe: 3, skill: 1, cues: "Upper arms touch floor gently, press up." },
  { id: "barbell_bench", name: "Barbell Bench Press", pattern: "horiz_press", equipment: ["barbell", "bench", "full_gym"], compound: true, ageSafe: 2, skill: 2, cues: "Plant feet, bar path slightly toward face." },
  { id: "machine_chest", name: "Machine Chest Press", pattern: "horiz_press", equipment: ["machines", "full_gym"], compound: true, ageSafe: 3, skill: 1, cues: "Shoulder blades set, smooth press." },
  { id: "pushup", name: "Push-Up", pattern: "horiz_press", equipment: ["bodyweight"], compound: true, ageSafe: 2, skill: 1, cues: "Body straight, lower chest toward floor." },
  { id: "knee_pushup", name: "Knee Push-Up", pattern: "horiz_press", equipment: ["bodyweight"], compound: true, ageSafe: 3, skill: 1, cues: "Knees down, full range chest to floor." },
  { id: "band_chest", name: "Band Chest Press", pattern: "horiz_press", equipment: ["bands"], compound: true, ageSafe: 3, skill: 1, cues: "Anchor band behind, press forward." },

  // Vertical press
  { id: "db_ohp", name: "Dumbbell Shoulder Press", pattern: "vert_press", equipment: ["dumbbells", "full_gym"], compound: true, ageSafe: 2, skill: 1, cues: "Ribs down, press overhead without leaning." },
  { id: "seated_ohp", name: "Seated Dumbbell Press", pattern: "vert_press", equipment: ["dumbbells", "bench", "full_gym"], compound: true, ageSafe: 3, skill: 1, cues: "Back supported, press straight up." },
  { id: "machine_shoulder", name: "Machine Shoulder Press", pattern: "vert_press", equipment: ["machines", "full_gym"], compound: true, ageSafe: 3, skill: 1, cues: "Do not shrug; controlled lockout." },
  { id: "band_ohp", name: "Band Overhead Press", pattern: "vert_press", equipment: ["bands"], compound: true, ageSafe: 3, skill: 1, cues: "Stand on band, press overhead." },
  { id: "pike_pushup", name: "Pike Push-Up", pattern: "vert_press", equipment: ["bodyweight"], compound: true, ageSafe: 2, skill: 2, cues: "Hips high, lower head toward floor." },

  // Horizontal pull
  { id: "db_row", name: "One-Arm Dumbbell Row", pattern: "horiz_pull", equipment: ["dumbbells", "bench", "full_gym"], compound: true, ageSafe: 3, skill: 1, cues: "Pull elbow to hip, squeeze shoulder blade." },
  { id: "chest_supported_row", name: "Chest-Supported Row", pattern: "horiz_pull", equipment: ["dumbbells", "machines", "full_gym"], compound: true, ageSafe: 3, skill: 1, cues: "Chest on pad, pull without shrugging." },
  { id: "seated_cable_row", name: "Seated Cable Row", pattern: "horiz_pull", equipment: ["machines", "full_gym"], compound: true, ageSafe: 3, skill: 1, cues: "Tall spine, pull to lower ribs." },
  { id: "band_row", name: "Band Row", pattern: "horiz_pull", equipment: ["bands"], compound: true, ageSafe: 3, skill: 1, cues: "Anchor band, pull elbows back." },
  { id: "inverted_row", name: "Inverted Row", pattern: "horiz_pull", equipment: ["bodyweight", "pullup_bar", "full_gym"], compound: true, ageSafe: 2, skill: 2, cues: "Body straight, pull chest to bar." },

  // Vertical pull
  { id: "lat_pulldown", name: "Lat Pulldown", pattern: "vert_pull", equipment: ["machines", "full_gym"], compound: true, ageSafe: 3, skill: 1, cues: "Pull bar to upper chest, control the return." },
  { id: "pullup", name: "Pull-Up", pattern: "vert_pull", equipment: ["pullup_bar", "full_gym"], compound: true, ageSafe: 2, skill: 3, cues: "From dead hang, pull chin over bar." },
  { id: "band_pulldown", name: "Band Pulldown", pattern: "vert_pull", equipment: ["bands"], compound: true, ageSafe: 3, skill: 1, cues: "Anchor high, pull elbows to ribs." },
  { id: "band_assisted_pullup", name: "Band-Assisted Pull-Up", pattern: "vert_pull", equipment: ["pullup_bar", "bands", "full_gym"], compound: true, ageSafe: 2, skill: 2, cues: "Use band for help, full hang each rep." },
  { id: "db_pullover", name: "Dumbbell Pullover", pattern: "vert_pull", equipment: ["dumbbells", "bench", "full_gym"], compound: false, ageSafe: 2, skill: 2, cues: "Slight elbow bend, stretch lats overhead." },

  // Core
  { id: "plank", name: "Plank", pattern: "core", equipment: ["bodyweight", "dumbbells", "bands", "full_gym"], compound: false, ageSafe: 3, skill: 1, cues: "Ribs down, glutes tight, breathe steadily." },
  { id: "dead_bug", name: "Dead Bug", pattern: "core", equipment: ["bodyweight"], compound: false, ageSafe: 3, skill: 1, cues: "Press low back to floor, move opposite limbs." },
  { id: "side_plank", name: "Side Plank", pattern: "core", equipment: ["bodyweight"], compound: false, ageSafe: 2, skill: 1, cues: "Stack hips, long neck." },
  { id: "pallof", name: "Pallof Press", pattern: "core", equipment: ["bands", "machines", "full_gym"], compound: false, ageSafe: 3, skill: 1, cues: "Resist rotation, press arms straight." },
  { id: "bird_dog", name: "Bird Dog", pattern: "core", equipment: ["bodyweight"], compound: false, ageSafe: 3, skill: 1, cues: "Reach long, keep hips level." },

  // Accessories
  { id: "db_curl", name: "Dumbbell Curl", pattern: "arms", equipment: ["dumbbells", "full_gym"], compound: false, ageSafe: 3, skill: 1, cues: "Elbows still, full squeeze at top." },
  { id: "triceps_ext", name: "Overhead Triceps Extension", pattern: "arms", equipment: ["dumbbells", "bands", "full_gym"], compound: false, ageSafe: 2, skill: 1, cues: "Elbows point up, control the stretch." },
  { id: "lateral_raise", name: "Lateral Raise", pattern: "shoulders", equipment: ["dumbbells", "bands", "full_gym"], compound: false, ageSafe: 2, skill: 1, cues: "Slight lean, raise to shoulder height." },
  { id: "face_pull", name: "Face Pull", pattern: "shoulders", equipment: ["bands", "machines", "full_gym"], compound: false, ageSafe: 3, skill: 1, cues: "Pull to face, external rotate at end." },
  { id: "calf_raise", name: "Calf Raise", pattern: "calves", equipment: ["bodyweight", "dumbbells", "machines", "full_gym"], compound: false, ageSafe: 3, skill: 1, cues: "Full stretch bottom, pause at top." },
  { id: "farmer_carry", name: "Farmer Carry", pattern: "carry", equipment: ["dumbbells", "kettlebell", "full_gym"], compound: true, ageSafe: 3, skill: 1, cues: "Tall posture, short even steps." },
  { id: "sit_to_stand", name: "Sit-to-Stand", pattern: "squat", equipment: ["bodyweight"], compound: true, ageSafe: 3, skill: 1, cues: "From chair, stand without using hands if possible." },
  { id: "step_up", name: "Step-Up", pattern: "squat", equipment: ["bodyweight", "dumbbells", "full_gym"], compound: true, ageSafe: 3, skill: 1, cues: "Drive through whole foot, control the descent." },

  // Cardio modalities (special)
  { id: "brisk_walk", name: "Brisk Walk", pattern: "cardio", equipment: ["bodyweight"], compound: false, ageSafe: 3, skill: 1, cues: "Conversational pace, steady breathing." },
  { id: "bike", name: "Steady Bike", pattern: "cardio", equipment: ["machines", "full_gym", "bodyweight"], compound: false, ageSafe: 3, skill: 1, cues: "Easy to moderate effort, smooth cadence." },
  { id: "jump_rope", name: "Jump Rope", pattern: "cardio", equipment: ["bodyweight"], compound: false, ageSafe: 1, skill: 2, cues: "Soft landings, short sessions." },
];

export function expandEquipment(selected) {
  const set = new Set(selected || []);
  if (set.has("full_gym")) {
    ["dumbbells", "barbell", "machines", "bands", "pullup_bar", "kettlebell", "bench", "bodyweight"].forEach((e) => set.add(e));
  }
  if (!set.has("bodyweight") && set.size === 0) set.add("bodyweight");
  if (set.size > 0 && !set.has("bodyweight")) set.add("bodyweight");
  return set;
}

export function filterExercises(userEquipment, { age = 30, experience = "beginner", patterns = null } = {}) {
  const eq = expandEquipment(userEquipment);
  const maxSkill = experience === "beginner" ? 2 : experience === "intermediate" ? 3 : 3;
  const minAgeSafe = age >= 60 ? 2 : 1;

  return EXERCISES.filter((ex) => {
    if (ex.pattern === "cardio") return false;
    if (patterns && !patterns.includes(ex.pattern)) return false;
    if (ex.skill > maxSkill && experience === "beginner") return false;
    if (age >= 60 && ex.ageSafe < minAgeSafe) return false;
    return ex.equipment.some((e) => eq.has(e));
  });
}

export function pickBest(pool, pattern, usedIds = new Set()) {
  const candidates = pool
    .filter((e) => e.pattern === pattern && !usedIds.has(e.id))
    .sort((a, b) => {
      // Prefer compound, higher ageSafe, lower skill for beginners (already filtered)
      if (a.compound !== b.compound) return a.compound ? -1 : 1;
      if (b.ageSafe !== a.ageSafe) return b.ageSafe - a.ageSafe;
      return a.skill - b.skill;
    });
  return candidates[0] || null;
}
