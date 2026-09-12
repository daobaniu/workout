import { differenceInCalendarDays, format } from "date-fns";
import { resolveExerciseGuide } from "@/lib/fitness/exercises";
import type { ProgramDayDraft, ResolvedTodayWorkout } from "./types";

/**
 * 根据计划开始日与训练日列表，解析「今天该练哪一天」。
 * 单一职责：只做日期 → 课表日的映射。
 */
export function resolveCycleDayIndex(
  startedAt: Date,
  dayCount: number,
  today = new Date(),
): number {
  if (dayCount <= 0) return 0;
  const elapsed = Math.max(0, differenceInCalendarDays(today, startedAt));
  return elapsed % dayCount;
}

export function toDateKey(date = new Date()): string {
  return format(date, "yyyy-MM-dd");
}

export function buildResolvedWorkout(input: {
  programId: string;
  programName: string;
  day: {
    id: string;
    dayIndex: number;
    name: string;
    focus: string | null;
    estimatedMin: number;
    exercisesJson: string;
  };
}): ResolvedTodayWorkout {
  const raw = JSON.parse(input.day.exercisesJson) as ProgramDayDraft["exercises"];
  const exercises = raw.map((e) => {
    const guide = resolveExerciseGuide({
      exerciseId: e.exerciseId,
      name: e.name,
      notes: e.notes,
    });
    return {
      ...e,
      howTo: e.howTo ?? guide.howTo,
      cautions: e.cautions?.length ? e.cautions : guide.cautions,
      notes: guide.notes,
      imageUrl: e.imageUrl ?? guide.imageUrl,
      videoUrl: e.videoUrl ?? guide.videoUrl,
    };
  });
  return {
    programId: input.programId,
    programName: input.programName,
    programDayId: input.day.id,
    dayIndex: input.day.dayIndex,
    title: `${input.programName} · ${input.day.name}`,
    focus: input.day.focus,
    estimatedMin: input.day.estimatedMin,
    exercises,
    isRestDay: exercises.length === 0,
  };
}
