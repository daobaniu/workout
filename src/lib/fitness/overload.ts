import type { ExercisePerformance } from "@/lib/db/exercise-set-log";
import { exerciseSetLogRepository } from "@/lib/db/exercise-set-log";
import type { ProgramExercise } from "@/lib/fitness/programs/types";

export type OverloadSuggestion = {
  exerciseId: string;
  lastLabel: string;
  suggestLabel: string;
  tip: string;
  suggestedWeightKg?: number | null;
  suggestedReps?: string;
};

function parseRepTarget(reps: string): number | null {
  const m = reps.match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

function formatLast(p: ExercisePerformance): string {
  const w =
    p.weightKg != null && p.weightKg > 0 ? `${p.weightKg}kg×${p.reps}` : `${p.reps} 次`;
  const rpe = p.rpe != null ? ` @RPE${p.rpe}` : "";
  return `${w}${rpe}`;
}

/**
 * 简单渐进超负荷规则（减脂期保守）：
 * - 有重量：优先 +1 次；已达处方上限附近则 +2.5kg 并回到目标次数下限
 * - 无重量：+1～2 次或略加时长感（次数）
 */
export function buildOverloadSuggestion(
  exercise: Pick<ProgramExercise, "exerciseId" | "name" | "reps" | "sets">,
  last: ExercisePerformance | null,
): OverloadSuggestion | null {
  if (!last) return null;

  const lastLabel = formatLast(last);
  const targetRep = parseRepTarget(exercise.reps) ?? last.reps;
  const hasWeight = last.weightKg != null && last.weightKg > 0;

  let suggestLabel: string;
  let tip: string;
  let suggestedWeightKg: number | null | undefined = last.weightKg;
  let suggestedReps: string | undefined;

  if (hasWeight) {
    if (last.reps >= targetRep) {
      const nextW = Math.round((last.weightKg! + 2.5) * 10) / 10;
      const backReps = Math.max(targetRep - 2, 5);
      suggestedWeightKg = nextW;
      suggestedReps = String(backReps);
      suggestLabel = `${nextW}kg×${backReps}`;
      tip = `上次 ${lastLabel}，今日建议试 ${suggestLabel}（加重量、次数略回）`;
    } else {
      const nextReps = last.reps + 1;
      suggestedReps = String(nextReps);
      suggestLabel = `${last.weightKg}kg×${nextReps}`;
      tip = `上次 ${lastLabel}，今日建议 ${suggestLabel}（同重量加 1 次）`;
    }
  } else {
    const nextReps = last.reps + 1;
    suggestedWeightKg = null;
    suggestedReps = String(nextReps);
    suggestLabel = `${nextReps} 次`;
    tip = `上次 ${lastLabel}，今日建议做到 ${suggestLabel}`;
  }

  return {
    exerciseId: exercise.exerciseId,
    lastLabel,
    suggestLabel,
    tip,
    suggestedWeightKg,
    suggestedReps,
  };
}

export async function attachOverloadToExercises(
  exercises: ProgramExercise[],
): Promise<{
  exercises: ProgramExercise[];
  tips: string[];
}> {
  const history = await exerciseSetLogRepository.getLastPerformances(
    exercises.map((e) => e.exerciseId),
  );
  const tips: string[] = [];
  const enriched = exercises.map((ex) => {
    const last = history.get(ex.exerciseId) ?? null;
    const sug = buildOverloadSuggestion(ex, last);
    if (!sug) return ex;
    tips.push(`${ex.name}：${sug.tip}`);
    const noteParts = [ex.notes, sug.tip].filter(Boolean);
    return {
      ...ex,
      weightKg: sug.suggestedWeightKg ?? ex.weightKg,
      reps: sug.suggestedReps ?? ex.reps,
      notes: noteParts.join(" · "),
    };
  });
  return { exercises: enriched, tips };
}
