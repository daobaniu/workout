/**
 * 训练消耗估算（MET 粗算）
 * 单一职责：只负责把「体重 + 时长 + 强度」换成 kcal。
 */

export type WorkoutIntensity = "easy" | "moderate" | "hard";

const MET: Record<WorkoutIntensity, number> = {
  easy: 3.5,
  moderate: 5.0,
  hard: 6.5,
};

/**
 * 公式：kcal ≈ MET × 体重(kg) × 小时
 */
export function estimateWorkoutCalories(input: {
  weightKg: number;
  durationMin: number;
  intensity?: WorkoutIntensity;
}): number {
  const weight = Math.max(input.weightKg, 30);
  const hours = Math.max(input.durationMin, 5) / 60;
  const met = MET[input.intensity ?? "moderate"];
  return Math.round(met * weight * hours);
}

/** 根据动作数量与是否含大复合动作推断强度 */
export function inferIntensity(exerciseCount: number, hasCompound: boolean): WorkoutIntensity {
  if (exerciseCount >= 7 || hasCompound) return "hard";
  if (exerciseCount <= 3) return "easy";
  return "moderate";
}
