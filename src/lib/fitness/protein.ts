import type { ExperienceLevel } from "@/lib/fitness/experience";
import {
  parseGoalMode,
  proteinGramsPerKg,
  type GoalMode,
} from "@/lib/fitness/goal-mode";

/**
 * 按目标模式 + 经验估算每日蛋白目标。
 * 减脂略高以保肌；增肌/维持用常见力量训练区间。
 */
export function estimateDailyProteinGoal(input: {
  weightKg: number;
  experienceLevel?: ExperienceLevel | string | null;
  goalMode?: GoalMode | string | null;
}) {
  const goalMode = parseGoalMode(input.goalMode);
  const gramsPerKg = proteinGramsPerKg(goalMode, input.experienceLevel);
  const raw = Math.round(input.weightKg * gramsPerKg);
  const dailyProteinGoal = Math.min(220, Math.max(90, raw));
  return {
    gramsPerKg,
    goalMode,
    dailyProteinGoal,
  };
}
