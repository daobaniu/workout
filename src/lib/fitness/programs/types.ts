export type ProgramSource = "builtin" | "ai" | "custom";
export type SplitType = "ppl" | "fullbody" | "upper_lower" | "custom";
export type TrainingPlace = "home" | "gym";

export type ProgramExercise = {
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  weightKg?: number | null;
  notes?: string;
  howTo?: string;
  cautions?: string[];
  imageUrl?: string;
  videoUrl?: string;
};

export type ProgramDayDraft = {
  dayIndex: number;
  name: string;
  focus?: string;
  estimatedMin: number;
  exercises: ProgramExercise[];
};

export type ProgramDraft = {
  key?: string;
  name: string;
  source: ProgramSource;
  splitType: SplitType;
  place: TrainingPlace;
  notes?: string;
  days: ProgramDayDraft[];
  /** 教练侧元数据：适合谁 / 每周几天 / 一句话 */
  level?: "beginner" | "intermediate";
  suggestedDaysPerWeek?: number[];
  pitch?: string;
  tags?: string[];
};

export type ResolvedTodayWorkout = {
  programId: string;
  programName: string;
  programDayId: string;
  dayIndex: number;
  title: string;
  focus: string | null;
  estimatedMin: number;
  exercises: ProgramExercise[];
  isRestDay: boolean;
};
