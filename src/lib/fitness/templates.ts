import { getExercise } from "./exercises";

export type WorkoutExercise = {
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  notes?: string;
};

export type WorkoutPlan = {
  templateId: string;
  title: string;
  estimatedMinutes: number;
  place: "home" | "gym";
  exercises: WorkoutExercise[];
  tips: string[];
};

type TemplateDef = {
  id: string;
  title: string;
  place: "home" | "gym";
  estimatedMinutes: number;
  exerciseIds: string[];
};

const templates: TemplateDef[] = [
  {
    id: "home_fullbody_30",
    title: "居家全身力量 · 30 分钟",
    place: "home",
    estimatedMinutes: 30,
    exerciseIds: [
      "jumping_jack",
      "bodyweight_squat",
      "pushup",
      "band_row",
      "glute_bridge",
      "plank",
    ],
  },
  {
    id: "home_fullbody_45",
    title: "居家全身力量 · 45 分钟",
    place: "home",
    estimatedMinutes: 45,
    exerciseIds: [
      "jumping_jack",
      "goblet_squat",
      "pushup",
      "dumbbell_row",
      "overhead_press",
      "rdl",
      "dead_bug",
      "plank",
    ],
  },
  {
    id: "gym_fullbody_45",
    title: "健身房全身力量 · 45 分钟",
    place: "gym",
    estimatedMinutes: 45,
    exerciseIds: [
      "back_squat",
      "bench_press",
      "barbell_row",
      "overhead_press",
      "rdl",
      "plank",
    ],
  },
  {
    id: "gym_push",
    title: "健身房推日（胸肩臂）",
    place: "gym",
    estimatedMinutes: 50,
    exerciseIds: [
      "bench_press",
      "incline_dumbbell_press",
      "overhead_press",
      "lateral_raise",
      "chest_fly",
      "tricep_extension",
    ],
  },
  {
    id: "gym_pull",
    title: "健身房拉日（背臂）",
    place: "gym",
    estimatedMinutes: 50,
    exerciseIds: [
      "pullup",
      "barbell_row",
      "lat_pulldown",
      "face_pull",
      "bicep_curl",
      "dead_bug",
    ],
  },
  {
    id: "gym_legs",
    title: "健身房腿日",
    place: "gym",
    estimatedMinutes: 50,
    exerciseIds: [
      "back_squat",
      "rdl",
      "leg_press",
      "lunge",
      "hip_thrust",
      "calf_raise",
    ],
  },
];

function buildPlan(template: TemplateDef, maxExercises?: number): WorkoutPlan {
  const ids =
    typeof maxExercises === "number"
      ? template.exerciseIds.slice(0, maxExercises)
      : template.exerciseIds;

  const workoutExercises: WorkoutExercise[] = ids.map((id) => {
    const ex = getExercise(id);
    return {
      exerciseId: id,
      name: ex?.name ?? id,
      sets: ex?.defaultSets ?? 3,
      reps: ex?.defaultReps ?? "10",
      notes: ex?.notes,
    };
  });

  return {
    templateId: template.id,
    title: template.title,
    estimatedMinutes: template.estimatedMinutes,
    place: template.place,
    exercises: workoutExercises,
    tips: [
      "组间休息 60–90 秒，复合动作可到 2 分钟",
      "动作质量优先于重量；疼痛（非肌肉酸）请停止",
      "减脂期力量训练以维持肌肉为主，不必追求力竭",
    ],
  };
}

export function suggestWorkoutPlan(options: {
  place?: "home" | "gym";
  minutes?: number;
  daysPerWeek?: number;
  lazy?: boolean;
  focus?: "full" | "push" | "pull" | "legs";
}): WorkoutPlan {
  const place = options.place ?? "home";
  const minutes = options.minutes ?? 40;
  const days = options.daysPerWeek ?? 3;
  const lazy = options.lazy ?? false;

  let template: TemplateDef | undefined;

  if (place === "home") {
    template =
      minutes <= 35
        ? templates.find((t) => t.id === "home_fullbody_30")
        : templates.find((t) => t.id === "home_fullbody_45");
  } else if (options.focus === "push") {
    template = templates.find((t) => t.id === "gym_push");
  } else if (options.focus === "pull") {
    template = templates.find((t) => t.id === "gym_pull");
  } else if (options.focus === "legs") {
    template = templates.find((t) => t.id === "gym_legs");
  } else if (days >= 4) {
    const rotation = [ "gym_push", "gym_pull", "gym_legs"] as const;
    const dayIndex = new Date().getDay() % rotation.length;
    template = templates.find((t) => t.id === rotation[dayIndex]);
  } else {
    template = templates.find((t) => t.id === "gym_fullbody_45");
  }

  if (!template) {
    template = templates[0];
  }

  const maxExercises = lazy ? Math.min(4, template.exerciseIds.length) : undefined;
  const plan = buildPlan(template, maxExercises);

  if (lazy) {
    plan.title = `${plan.title}（偷懒精简版）`;
    plan.tips = [
      ...plan.tips,
      "今天做完这几组就算胜利，明天再加回完整量",
    ];
    plan.estimatedMinutes = Math.min(plan.estimatedMinutes, minutes || 25);
  } else if (minutes < plan.estimatedMinutes) {
    const trimmed = buildPlan(
      template,
      Math.max(4, Math.floor(template.exerciseIds.length * (minutes / plan.estimatedMinutes))),
    );
    trimmed.title = `${trimmed.title}（按时长裁剪）`;
    trimmed.estimatedMinutes = minutes;
    return trimmed;
  }

  return plan;
}

export function listTemplates() {
  return templates.map((t) => ({
    id: t.id,
    title: t.title,
    place: t.place,
    estimatedMinutes: t.estimatedMinutes,
  }));
}
