export type Equipment = "bodyweight" | "dumbbell" | "barbell" | "machine" | "band";

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "legs"
  | "glutes"
  | "core"
  | "arms"
  | "full";

export type Exercise = {
  id: string;
  name: string;
  muscles: MuscleGroup[];
  equipment: Equipment[];
  defaultSets: number;
  defaultReps: string;
  homeAlternative?: string;
  notes?: string;
};

export const exercises: Exercise[] = [
  {
    id: "pushup",
    name: "俯卧撑",
    muscles: ["chest", "arms"],
    equipment: ["bodyweight"],
    defaultSets: 3,
    defaultReps: "8-15",
    notes: "核心收紧，肘关节约 45 度",
  },
  {
    id: "knee_pushup",
    name: "跪姿俯卧撑",
    muscles: ["chest", "arms"],
    equipment: ["bodyweight"],
    defaultSets: 3,
    defaultReps: "10-15",
  },
  {
    id: "dumbbell_press",
    name: "哑铃卧推",
    muscles: ["chest", "arms"],
    equipment: ["dumbbell"],
    defaultSets: 3,
    defaultReps: "8-12",
    homeAlternative: "pushup",
  },
  {
    id: "bench_press",
    name: "杠铃卧推",
    muscles: ["chest", "arms"],
    equipment: ["barbell"],
    defaultSets: 4,
    defaultReps: "6-10",
    homeAlternative: "dumbbell_press",
  },
  {
    id: "incline_dumbbell_press",
    name: "上斜哑铃卧推",
    muscles: ["chest", "shoulders"],
    equipment: ["dumbbell"],
    defaultSets: 3,
    defaultReps: "8-12",
  },
  {
    id: "band_row",
    name: "弹力带划船",
    muscles: ["back", "arms"],
    equipment: ["band", "bodyweight"],
    defaultSets: 3,
    defaultReps: "12-15",
  },
  {
    id: "dumbbell_row",
    name: "哑铃单臂划船",
    muscles: ["back", "arms"],
    equipment: ["dumbbell"],
    defaultSets: 3,
    defaultReps: "8-12",
    homeAlternative: "band_row",
  },
  {
    id: "barbell_row",
    name: "杠铃划船",
    muscles: ["back", "arms"],
    equipment: ["barbell"],
    defaultSets: 4,
    defaultReps: "6-10",
    homeAlternative: "dumbbell_row",
  },
  {
    id: "lat_pulldown",
    name: "高位下拉",
    muscles: ["back", "arms"],
    equipment: ["machine"],
    defaultSets: 3,
    defaultReps: "8-12",
    homeAlternative: "band_row",
  },
  {
    id: "pullup",
    name: "引体向上",
    muscles: ["back", "arms"],
    equipment: ["bodyweight"],
    defaultSets: 3,
    defaultReps: "5-10",
    homeAlternative: "band_row",
  },
  {
    id: "overhead_press",
    name: "哑铃推举",
    muscles: ["shoulders", "arms"],
    equipment: ["dumbbell"],
    defaultSets: 3,
    defaultReps: "8-12",
  },
  {
    id: "lateral_raise",
    name: "侧平举",
    muscles: ["shoulders"],
    equipment: ["dumbbell"],
    defaultSets: 3,
    defaultReps: "12-15",
  },
  {
    id: "pike_pushup",
    name: "派克俯卧撑",
    muscles: ["shoulders"],
    equipment: ["bodyweight"],
    defaultSets: 3,
    defaultReps: "8-12",
  },
  {
    id: "bodyweight_squat",
    name: "徒手深蹲",
    muscles: ["legs", "glutes"],
    equipment: ["bodyweight"],
    defaultSets: 3,
    defaultReps: "12-20",
  },
  {
    id: "goblet_squat",
    name: "高脚杯深蹲",
    muscles: ["legs", "glutes"],
    equipment: ["dumbbell"],
    defaultSets: 3,
    defaultReps: "10-15",
    homeAlternative: "bodyweight_squat",
  },
  {
    id: "back_squat",
    name: "杠铃深蹲",
    muscles: ["legs", "glutes"],
    equipment: ["barbell"],
    defaultSets: 4,
    defaultReps: "6-10",
    homeAlternative: "goblet_squat",
  },
  {
    id: "leg_press",
    name: "腿举",
    muscles: ["legs", "glutes"],
    equipment: ["machine"],
    defaultSets: 3,
    defaultReps: "10-15",
    homeAlternative: "goblet_squat",
  },
  {
    id: "lunge",
    name: "弓步蹲",
    muscles: ["legs", "glutes"],
    equipment: ["bodyweight", "dumbbell"],
    defaultSets: 3,
    defaultReps: "10/腿",
  },
  {
    id: "rdl",
    name: "罗马尼亚硬拉",
    muscles: ["legs", "glutes", "back"],
    equipment: ["dumbbell", "barbell"],
    defaultSets: 3,
    defaultReps: "8-12",
    notes: "髋铰链，背部保持中立",
  },
  {
    id: "hip_thrust",
    name: "臀桥/髋推进",
    muscles: ["glutes"],
    equipment: ["bodyweight", "dumbbell", "barbell"],
    defaultSets: 3,
    defaultReps: "10-15",
  },
  {
    id: "calf_raise",
    name: "提踵",
    muscles: ["legs"],
    equipment: ["bodyweight", "dumbbell", "machine"],
    defaultSets: 3,
    defaultReps: "12-20",
  },
  {
    id: "plank",
    name: "平板支撑",
    muscles: ["core"],
    equipment: ["bodyweight"],
    defaultSets: 3,
    defaultReps: "30-60秒",
  },
  {
    id: "dead_bug",
    name: "死虫式",
    muscles: ["core"],
    equipment: ["bodyweight"],
    defaultSets: 3,
    defaultReps: "8/侧",
  },
  {
    id: "bird_dog",
    name: "鸟狗式",
    muscles: ["core", "back"],
    equipment: ["bodyweight"],
    defaultSets: 3,
    defaultReps: "8/侧",
  },
  {
    id: "bicycle_crunch",
    name: "自行车卷腹",
    muscles: ["core"],
    equipment: ["bodyweight"],
    defaultSets: 3,
    defaultReps: "12-20",
  },
  {
    id: "bicep_curl",
    name: "哑铃弯举",
    muscles: ["arms"],
    equipment: ["dumbbell"],
    defaultSets: 3,
    defaultReps: "10-15",
  },
  {
    id: "tricep_extension",
    name: "臂屈伸/过头臂屈伸",
    muscles: ["arms"],
    equipment: ["dumbbell", "bodyweight"],
    defaultSets: 3,
    defaultReps: "10-15",
  },
  {
    id: "glute_bridge",
    name: "臀桥",
    muscles: ["glutes", "core"],
    equipment: ["bodyweight"],
    defaultSets: 3,
    defaultReps: "12-20",
  },
  {
    id: "mountain_climber",
    name: "登山跑",
    muscles: ["core", "full"],
    equipment: ["bodyweight"],
    defaultSets: 3,
    defaultReps: "20-40秒",
  },
  {
    id: "jumping_jack",
    name: "开合跳",
    muscles: ["full"],
    equipment: ["bodyweight"],
    defaultSets: 2,
    defaultReps: "30-45秒",
    notes: "热身用",
  },
  {
    id: "face_pull",
    name: "面拉",
    muscles: ["shoulders", "back"],
    equipment: ["band", "machine"],
    defaultSets: 3,
    defaultReps: "12-15",
  },
  {
    id: "chest_fly",
    name: "哑铃飞鸟",
    muscles: ["chest"],
    equipment: ["dumbbell"],
    defaultSets: 3,
    defaultReps: "10-15",
  },
];

export function getExercise(id: string) {
  return exercises.find((e) => e.id === id);
}
