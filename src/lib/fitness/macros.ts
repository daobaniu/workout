import { parseGoalMode, type GoalMode } from "@/lib/fitness/goal-mode";

/**
 * 由热量预算与蛋白目标推算碳/脂目标；分配随目标模式略调。
 * 蛋白优先占热量，脂肪按模式比例，剩余给碳水。
 */
export function estimateMacroGoals(input: {
  calorieGoal: number;
  proteinGoalG: number;
  weightKg?: number | null;
  goalMode?: GoalMode | string | null;
}) {
  const goalMode = parseGoalMode(input.goalMode);
  const proteinKcal = input.proteinGoalG * 4;

  // 脂肪占比：减脂略中、维持中、增肌略低以腾出碳水
  const fatPct =
    goalMode === "bulk" ? 0.25 : goalMode === "maintain" ? 0.3 : 0.28;
  const fatCeilPct = goalMode === "bulk" ? 0.32 : 0.35;
  const carbsFloor = goalMode === "bulk" ? 150 : goalMode === "maintain" ? 110 : 80;

  const fatFloor =
    input.weightKg != null
      ? Math.round(input.weightKg * (goalMode === "cut" ? 0.8 : 0.7))
      : Math.round((input.calorieGoal * 0.25) / 9);
  const fatFromPct = Math.round((input.calorieGoal * fatPct) / 9);
  const fatGoalG = Math.min(
    Math.max(fatFloor, fatFromPct),
    Math.round((input.calorieGoal * fatCeilPct) / 9),
  );
  const fatKcal = fatGoalG * 9;
  const carbsKcal = Math.max(input.calorieGoal - proteinKcal - fatKcal, 0);
  const carbsGoalG = Math.round(carbsKcal / 4);

  return {
    goalMode,
    proteinGoalG: input.proteinGoalG,
    carbsGoalG: Math.max(carbsGoalG, carbsFloor),
    fatGoalG: Math.max(fatGoalG, goalMode === "bulk" ? 40 : 35),
  };
}
