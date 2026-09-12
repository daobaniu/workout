import { getProfile } from "@/lib/db/queries";
import { resolveExerciseGuide } from "@/lib/fitness/exercises";
import { programService, rankBuiltinPrograms } from "@/lib/fitness/programs";
import type { ExperienceLevel } from "@/lib/fitness/experience";

function enrichExercise(e: {
  exerciseId?: string;
  name: string;
  sets: number;
  reps: string;
  weightKg?: number | null;
  notes?: string;
  howTo?: string;
  cautions?: string[];
  imageUrl?: string;
  videoUrl?: string;
}) {
  const guide = resolveExerciseGuide({
    exerciseId: e.exerciseId,
    name: e.name,
    notes: e.notes,
  });
  return {
    exerciseId: e.exerciseId,
    name: e.name,
    sets: e.sets,
    reps: e.reps,
    weightKg: e.weightKg ?? null,
    // 保留超负荷等业务 notes，再回落到动作库提示
    notes: e.notes ?? guide.notes,
    howTo: e.howTo ?? guide.howTo,
    cautions: e.cautions?.length ? e.cautions : guide.cautions,
    imageUrl: e.imageUrl ?? guide.imageUrl,
    videoUrl: e.videoUrl ?? guide.videoUrl,
  };
}

function mapBuiltin(p: {
  key?: string;
  name: string;
  splitType: string;
  place: string;
  notes?: string;
  level?: string;
  suggestedDaysPerWeek?: number[];
  pitch?: string;
  tags?: string[];
  days: Array<{
    dayIndex: number;
    name: string;
    focus?: string;
    estimatedMin: number;
    exercises: Array<{
      exerciseId?: string;
      name: string;
      sets: number;
      reps: string;
      notes?: string;
      howTo?: string;
      cautions?: string[];
      imageUrl?: string;
      videoUrl?: string;
    }>;
  }>;
}) {
  return {
    key: p.key ?? p.name,
    name: p.name,
    splitType: p.splitType,
    place: p.place,
    notes: p.notes,
    level: p.level ?? "beginner",
    suggestedDaysPerWeek: p.suggestedDaysPerWeek ?? [],
    pitch: p.pitch ?? p.notes ?? "",
    tags: p.tags ?? [],
    dayCount: p.days.length,
    days: p.days.map((d) => ({
      dayIndex: d.dayIndex,
      name: d.name,
      focus: d.focus,
      estimatedMin: d.estimatedMin,
      exerciseCount: d.exercises.length,
      exercises: d.exercises.map((e) => enrichExercise(e)),
    })),
  };
}

export type ProgramsPageData = {
  profile: {
    place: "home" | "gym";
    daysPerWeek: number;
    experienceLevel: ExperienceLevel;
  };
  todayPlan: {
    title: string;
    estimatedMin: number;
    isRestDay: boolean;
    exercises: ReturnType<typeof enrichExercise>[];
    programId?: string;
    programName?: string;
    programDayId?: string;
    dayIndex?: number;
    focus?: string | null;
  } | null;
  recommended: ReturnType<typeof mapBuiltin>[];
  others: ReturnType<typeof mapBuiltin>[];
  builtin: ReturnType<typeof mapBuiltin>[];
  programs: Array<{
    id: string;
    name: string;
    source: string;
    splitType: string;
    place: string;
    isActive: boolean;
    startedAt: Date | string;
    notes: string | null;
    dayCount: number;
    days: Array<{
      id: string;
      dayIndex: number;
      name: string;
      focus: string | null;
      estimatedMin: number;
      exercises: ReturnType<typeof enrichExercise>[];
    }>;
  }>;
};

export async function loadProgramsPageData(options?: {
  place?: "home" | "gym" | null;
}): Promise<ProgramsPageData> {
  const profile = await getProfile();
  const place =
    options?.place ?? (profile?.trainingPlace === "gym" ? "gym" : "home");
  const daysPerWeek = profile?.daysPerWeek ?? 3;
  const experienceLevel: ExperienceLevel =
    profile?.experienceLevel === "intermediate" ? "intermediate" : "beginner";

  const placeBuiltins = programService.listBuiltin(place);
  const { recommended, others } = rankBuiltinPrograms(placeBuiltins, {
    place,
    daysPerWeek,
    experienceLevel,
  });

  const programs = await programService.listUserPrograms();
  const todayPlan = await programService.resolveToday();

  return {
    profile: {
      place,
      daysPerWeek,
      experienceLevel,
    },
    todayPlan: todayPlan
      ? {
          ...todayPlan,
          exercises: todayPlan.exercises.map((e) => enrichExercise(e)),
        }
      : null,
    recommended: recommended.map(mapBuiltin),
    others: others.map(mapBuiltin),
    builtin: placeBuiltins.map(mapBuiltin),
    programs: programs.map((p) => ({
      id: p.id,
      name: p.name,
      source: p.source,
      splitType: p.splitType,
      place: p.place,
      isActive: p.isActive,
      startedAt: p.startedAt ?? p.createdAt,
      notes: p.notes,
      dayCount: p.days.length,
      days: p.days.map((d) => {
        const exercises = (
          JSON.parse(d.exercisesJson) as Array<{
            exerciseId?: string;
            name: string;
            sets: number;
            reps: string;
            notes?: string;
          }>
        ).map((e) => enrichExercise(e));
        return {
          id: d.id,
          dayIndex: d.dayIndex,
          name: d.name,
          focus: d.focus,
          estimatedMin: d.estimatedMin,
          exercises,
        };
      }),
    })),
  };
}
