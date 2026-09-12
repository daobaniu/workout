import { getExercise } from "@/lib/fitness/exercises";
import type { ProgramDraft, ProgramExercise, TrainingPlace } from "./types";

function ex(id: string, sets?: number, reps?: string): ProgramExercise {
  const meta = getExercise(id);
  return {
    exerciseId: id,
    name: meta?.name ?? id,
    sets: sets ?? meta?.defaultSets ?? 3,
    reps: reps ?? meta?.defaultReps ?? "10",
    notes: meta?.notes,
    howTo: meta?.howTo,
    cautions: meta?.cautions,
    imageUrl: meta?.media?.imageUrl,
    videoUrl: meta?.media?.videoUrl,
  };
}

/** 内置计划目录（开闭：新增计划只加这里，不改服务逻辑） */
export function listAllBuiltinPrograms(): ProgramDraft[] {
  return [
    gymPpl(),
    gymFullbody3(),
    gymUpperLower(),
    homeFullbody3(),
    homeExpress(),
    homePushPullCore(),
    homeUpperLower(),
    homeDumbbell3(),
  ];
}

export function listBuiltinPrograms(place: TrainingPlace = "gym"): ProgramDraft[] {
  return listAllBuiltinPrograms().filter((p) => p.place === place);
}

export function getBuiltinProgram(
  key: string,
  place: TrainingPlace = "gym",
): ProgramDraft | null {
  const all = listAllBuiltinPrograms();
  const byKey = all.find((p) => p.key === key);
  if (byKey) return byKey;
  return listBuiltinPrograms(place).find((p) => p.name === key) ?? null;
}

function gymPpl(): ProgramDraft {
  return {
    key: "gym_ppl",
    name: "健身房三分化 · 推拉腿",
    source: "builtin",
    splitType: "ppl",
    place: "gym",
    level: "intermediate",
    suggestedDaysPerWeek: [3, 4, 5, 6],
    pitch: "分化清晰、练得全，适合每周能来健身房至少 3 天的人。",
    tags: ["健身房", "进阶", "每周3–6练"],
    notes: "经典 PPL：推日胸肩三头，拉日背二头，腿日下肢。每周可练 3～6 天循环。",
    days: [
      {
        dayIndex: 0,
        name: "推日",
        focus: "chest_shoulders_triceps",
        estimatedMin: 50,
        exercises: [
          ex("bench_press", 4, "6-10"),
          ex("incline_dumbbell_press", 3, "8-12"),
          ex("overhead_press", 3, "8-12"),
          ex("lateral_raise", 3, "12-15"),
          ex("chest_fly", 3, "10-15"),
          ex("tricep_extension", 3, "10-15"),
        ],
      },
      {
        dayIndex: 1,
        name: "拉日",
        focus: "back_biceps",
        estimatedMin: 50,
        exercises: [
          ex("pullup", 3, "5-10"),
          ex("barbell_row", 4, "6-10"),
          ex("lat_pulldown", 3, "8-12"),
          ex("face_pull", 3, "12-15"),
          ex("bicep_curl", 3, "10-15"),
          ex("dead_bug", 3, "8/侧"),
        ],
      },
      {
        dayIndex: 2,
        name: "腿日",
        focus: "legs_glutes",
        estimatedMin: 50,
        exercises: [
          ex("back_squat", 4, "6-10"),
          ex("rdl", 3, "8-12"),
          ex("leg_press", 3, "10-15"),
          ex("lunge", 3, "10/腿"),
          ex("hip_thrust", 3, "10-15"),
          ex("calf_raise", 3, "12-20"),
        ],
      },
    ],
  };
}

function gymFullbody3(): ProgramDraft {
  return {
    key: "gym_fullbody_3",
    name: "健身房全身 · 每周三练",
    source: "builtin",
    splitType: "fullbody",
    place: "gym",
    level: "beginner",
    suggestedDaysPerWeek: [3],
    pitch: "时间不多也能练全，入门减脂力量首选。",
    tags: ["健身房", "入门", "每周3练"],
    notes: "适合每周练 3 天，每次覆盖主要肌群。",
    days: [
      {
        dayIndex: 0,
        name: "全身 A",
        focus: "full",
        estimatedMin: 45,
        exercises: [
          ex("back_squat", 3, "6-10"),
          ex("bench_press", 3, "6-10"),
          ex("barbell_row", 3, "6-10"),
          ex("overhead_press", 3, "8-12"),
          ex("plank", 3, "30-60秒"),
        ],
      },
      {
        dayIndex: 1,
        name: "全身 B",
        focus: "full",
        estimatedMin: 45,
        exercises: [
          ex("rdl", 3, "8-12"),
          ex("incline_dumbbell_press", 3, "8-12"),
          ex("lat_pulldown", 3, "8-12"),
          ex("lunge", 3, "10/腿"),
          ex("dead_bug", 3, "8/侧"),
        ],
      },
      {
        dayIndex: 2,
        name: "全身 C",
        focus: "full",
        estimatedMin: 45,
        exercises: [
          ex("leg_press", 3, "10-15"),
          ex("dumbbell_press", 3, "8-12"),
          ex("dumbbell_row", 3, "8-12"),
          ex("hip_thrust", 3, "10-15"),
          ex("face_pull", 3, "12-15"),
        ],
      },
    ],
  };
}

function gymUpperLower(): ProgramDraft {
  return {
    key: "gym_upper_lower",
    name: "健身房上下肢分化",
    source: "builtin",
    splitType: "upper_lower",
    place: "gym",
    level: "intermediate",
    suggestedDaysPerWeek: [4],
    pitch: "上下肢交替，恢复更好，适合稳定每周四练。",
    tags: ["健身房", "进阶", "每周4练"],
    notes: "上肢 / 下肢交替，适合每周 4 练。",
    days: [
      {
        dayIndex: 0,
        name: "上肢 A",
        focus: "upper",
        estimatedMin: 50,
        exercises: [
          ex("bench_press", 4, "6-10"),
          ex("barbell_row", 4, "6-10"),
          ex("overhead_press", 3, "8-12"),
          ex("lat_pulldown", 3, "8-12"),
          ex("bicep_curl", 3, "10-15"),
          ex("tricep_extension", 3, "10-15"),
        ],
      },
      {
        dayIndex: 1,
        name: "下肢 A",
        focus: "lower",
        estimatedMin: 50,
        exercises: [
          ex("back_squat", 4, "6-10"),
          ex("rdl", 3, "8-12"),
          ex("leg_press", 3, "10-15"),
          ex("hip_thrust", 3, "10-15"),
          ex("calf_raise", 3, "12-20"),
          ex("plank", 3, "30-60秒"),
        ],
      },
      {
        dayIndex: 2,
        name: "上肢 B",
        focus: "upper",
        estimatedMin: 50,
        exercises: [
          ex("incline_dumbbell_press", 3, "8-12"),
          ex("pullup", 3, "5-10"),
          ex("dumbbell_row", 3, "8-12"),
          ex("lateral_raise", 3, "12-15"),
          ex("face_pull", 3, "12-15"),
          ex("chest_fly", 3, "10-15"),
        ],
      },
      {
        dayIndex: 3,
        name: "下肢 B",
        focus: "lower",
        estimatedMin: 50,
        exercises: [
          ex("goblet_squat", 3, "10-15"),
          ex("lunge", 3, "10/腿"),
          ex("rdl", 3, "8-12"),
          ex("hip_thrust", 3, "10-15"),
          ex("calf_raise", 3, "12-20"),
          ex("dead_bug", 3, "8/侧"),
        ],
      },
    ],
  };
}

function homeFullbody3(): ProgramDraft {
  return {
    key: "home_fullbody_3",
    name: "居家全身 · 每周三练",
    source: "builtin",
    splitType: "fullbody",
    place: "home",
    level: "beginner",
    suggestedDaysPerWeek: [3],
    pitch: "徒手/轻器械也能练，在家坚持最重要。",
    tags: ["居家", "入门", "每周3练"],
    notes: "徒手/弹力带为主，适合在家坚持。",
    days: [
      {
        dayIndex: 0,
        name: "居家 A",
        focus: "full",
        estimatedMin: 35,
        exercises: [
          ex("jumping_jack", 2, "30-45秒"),
          ex("bodyweight_squat", 3, "12-20"),
          ex("pushup", 3, "8-15"),
          ex("band_row", 3, "12-15"),
          ex("glute_bridge", 3, "12-20"),
          ex("plank", 3, "30-60秒"),
        ],
      },
      {
        dayIndex: 1,
        name: "居家 B",
        focus: "full",
        estimatedMin: 35,
        exercises: [
          ex("bodyweight_squat", 3, "12-15"),
          ex("knee_pushup", 3, "10-15"),
          ex("band_row", 3, "12-15"),
          ex("lunge", 3, "10/腿"),
          ex("dead_bug", 3, "8/侧"),
        ],
      },
      {
        dayIndex: 2,
        name: "居家 C",
        focus: "full",
        estimatedMin: 40,
        exercises: [
          ex("bodyweight_squat", 3, "15-20"),
          ex("pike_pushup", 3, "8-12"),
          ex("band_row", 3, "12-15"),
          ex("hip_thrust", 3, "12-15"),
          ex("mountain_climber", 3, "20-40秒"),
          ex("plank", 3, "30-60秒"),
        ],
      },
    ],
  };
}

/** 时间紧：短课 + 有氧收尾 */
function homeExpress(): ProgramDraft {
  return {
    key: "home_express",
    name: "居家快练 · 25 分钟",
    source: "builtin",
    splitType: "fullbody",
    place: "home",
    level: "beginner",
    suggestedDaysPerWeek: [2, 3, 4],
    pitch: "没空就练这套：热身 + 4 个动作 + 快走收尾。",
    tags: ["居家", "入门", "短时", "每周2–4练"],
    notes: "适合忙碌日程；做不完可先保证深蹲/推/划。",
    days: [
      {
        dayIndex: 0,
        name: "快练 A",
        focus: "full",
        estimatedMin: 25,
        exercises: [
          ex("jumping_jack", 2, "30秒"),
          ex("bodyweight_squat", 3, "15"),
          ex("pushup", 3, "8-12"),
          ex("band_row", 3, "12"),
          ex("plank", 2, "30-45秒"),
          ex("brisk_walk", 1, "8-10分钟"),
        ],
      },
      {
        dayIndex: 1,
        name: "快练 B",
        focus: "full",
        estimatedMin: 25,
        exercises: [
          ex("jump_rope", 2, "30秒"),
          ex("lunge", 3, "10/腿"),
          ex("knee_pushup", 3, "10-15"),
          ex("glute_bridge", 3, "15"),
          ex("dead_bug", 2, "8/侧"),
          ex("brisk_walk", 1, "8-10分钟"),
        ],
      },
      {
        dayIndex: 2,
        name: "快练 C",
        focus: "full",
        estimatedMin: 25,
        exercises: [
          ex("mountain_climber", 2, "30秒"),
          ex("bodyweight_squat", 3, "15-20"),
          ex("pike_pushup", 3, "6-10"),
          ex("band_row", 3, "12-15"),
          ex("bicycle_crunch", 2, "12/侧"),
          ex("jog", 1, "8-12分钟"),
        ],
      },
    ],
  };
}

/** 居家三分化：推 / 拉 / 腿核心（无杠铃器械） */
function homePushPullCore(): ProgramDraft {
  return {
    key: "home_push_pull_core",
    name: "居家三分化 · 推拉腿",
    source: "builtin",
    splitType: "ppl",
    place: "home",
    level: "intermediate",
    suggestedDaysPerWeek: [3, 4, 5, 6],
    pitch: "在家也能按推拉腿练，分化比全身课更专注。",
    tags: ["居家", "进阶", "每周3–6练"],
    notes: "徒手 + 弹力带/哑铃；没有弹力带可用桌下划船替代意识练。",
    days: [
      {
        dayIndex: 0,
        name: "推日",
        focus: "push",
        estimatedMin: 40,
        exercises: [
          ex("pushup", 4, "8-15"),
          ex("pike_pushup", 3, "6-12"),
          ex("knee_pushup", 2, "10-15"),
          ex("tricep_extension", 3, "10-15"),
          ex("plank", 3, "30-60秒"),
        ],
      },
      {
        dayIndex: 1,
        name: "拉日",
        focus: "pull",
        estimatedMin: 40,
        exercises: [
          ex("band_row", 4, "12-15"),
          ex("dumbbell_row", 3, "10-12"),
          ex("face_pull", 3, "12-15"),
          ex("bicep_curl", 3, "10-15"),
          ex("bird_dog", 3, "8/侧"),
        ],
      },
      {
        dayIndex: 2,
        name: "腿+核心",
        focus: "legs_core",
        estimatedMin: 40,
        exercises: [
          ex("bodyweight_squat", 4, "15-20"),
          ex("lunge", 3, "10/腿"),
          ex("glute_bridge", 3, "15-20"),
          ex("calf_raise", 3, "15-20"),
          ex("dead_bug", 3, "8/侧"),
          ex("plank", 2, "40-60秒"),
        ],
      },
    ],
  };
}

/** 居家上下肢 · 四天 */
function homeUpperLower(): ProgramDraft {
  return {
    key: "home_upper_lower",
    name: "居家上下肢分化",
    source: "builtin",
    splitType: "upper_lower",
    place: "home",
    level: "intermediate",
    suggestedDaysPerWeek: [4],
    pitch: "上下肢隔天练，恢复更好，适合能固定四练的人。",
    tags: ["居家", "进阶", "每周4练"],
    notes: "上肢以推拉为主，下肢深蹲弓步臀桥；哑铃可选。",
    days: [
      {
        dayIndex: 0,
        name: "上肢 A",
        focus: "upper",
        estimatedMin: 40,
        exercises: [
          ex("pushup", 4, "8-15"),
          ex("band_row", 4, "12-15"),
          ex("pike_pushup", 3, "6-12"),
          ex("face_pull", 3, "12-15"),
          ex("plank", 3, "30-45秒"),
        ],
      },
      {
        dayIndex: 1,
        name: "下肢 A",
        focus: "lower",
        estimatedMin: 40,
        exercises: [
          ex("bodyweight_squat", 4, "15-20"),
          ex("lunge", 3, "10/腿"),
          ex("hip_thrust", 3, "12-15"),
          ex("calf_raise", 3, "15-20"),
          ex("dead_bug", 3, "8/侧"),
        ],
      },
      {
        dayIndex: 2,
        name: "上肢 B",
        focus: "upper",
        estimatedMin: 40,
        exercises: [
          ex("knee_pushup", 3, "12-15"),
          ex("dumbbell_row", 3, "10-12"),
          ex("lateral_raise", 3, "12-15"),
          ex("bicep_curl", 3, "10-15"),
          ex("tricep_extension", 3, "10-15"),
          ex("bird_dog", 2, "8/侧"),
        ],
      },
      {
        dayIndex: 3,
        name: "下肢 B",
        focus: "lower",
        estimatedMin: 40,
        exercises: [
          ex("goblet_squat", 3, "10-15"),
          ex("glute_bridge", 4, "15-20"),
          ex("lunge", 3, "10/腿"),
          ex("mountain_climber", 3, "20-30秒"),
          ex("plank", 3, "40-60秒"),
        ],
      },
    ],
  };
}

/** 有一对哑铃：居家力量感更强 */
function homeDumbbell3(): ProgramDraft {
  return {
    key: "home_dumbbell_3",
    name: "居家哑铃 · 每周三练",
    source: "builtin",
    splitType: "fullbody",
    place: "home",
    level: "intermediate",
    suggestedDaysPerWeek: [3],
    pitch: "家里有一对哑铃就能练得像小型健身房。",
    tags: ["居家", "哑铃", "进阶", "每周3练"],
    notes: "需要哑铃；没有可用居家全身徒手套代替。",
    days: [
      {
        dayIndex: 0,
        name: "哑铃全身 A",
        focus: "full",
        estimatedMin: 40,
        exercises: [
          ex("goblet_squat", 3, "10-15"),
          ex("dumbbell_press", 3, "8-12"),
          ex("dumbbell_row", 3, "8-12"),
          ex("rdl", 3, "8-12"),
          ex("plank", 3, "30-60秒"),
        ],
      },
      {
        dayIndex: 1,
        name: "哑铃全身 B",
        focus: "full",
        estimatedMin: 40,
        exercises: [
          ex("lunge", 3, "10/腿"),
          ex("overhead_press", 3, "8-12"),
          ex("dumbbell_row", 3, "10-12"),
          ex("hip_thrust", 3, "10-15"),
          ex("lateral_raise", 3, "12-15"),
          ex("dead_bug", 2, "8/侧"),
        ],
      },
      {
        dayIndex: 2,
        name: "哑铃全身 C",
        focus: "full",
        estimatedMin: 40,
        exercises: [
          ex("goblet_squat", 3, "12-15"),
          ex("incline_dumbbell_press", 3, "8-12"),
          ex("band_row", 3, "12-15"),
          ex("bicep_curl", 3, "10-15"),
          ex("tricep_extension", 3, "10-15"),
          ex("plank", 2, "40-60秒"),
        ],
      },
    ],
  };
}
