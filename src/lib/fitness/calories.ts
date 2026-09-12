import {
  parseGoalMode,
  type GoalMode,
} from "@/lib/fitness/goal-mode";

export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

/**
 * 使用 Mifflin-St Jeor 公式估算基础代谢率（BMR）。
 *
 * 公式：
 * - 男性：10 × 体重(kg) + 6.25 × 身高(cm) - 5 × 年龄 + 5
 * - 女性：10 × 体重(kg) + 6.25 × 身高(cm) - 5 × 年龄 - 161
 */
export function estimateBmr(input: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
}) {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
  return Math.round(input.sex === "male" ? base + 5 : base - 161);
}

/** 每日总能量消耗 (TDEE) */
export function estimateTdee(input: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
  activityLevel: ActivityLevel;
}) {
  return Math.round(estimateBmr(input) * ACTIVITY_FACTOR[input.activityLevel]);
}

export type CalorieGoalEstimate = {
  bmr: number;
  tdee: number;
  goalMode: GoalMode;
  /** 减脂缺口；维持/增肌为 0 */
  deficit: number;
  /** 增肌盈余；减脂/维持为 0 */
  surplus: number;
  dailyCalorieGoal: number;
  /** 给 UI 用的一句话策略 */
  strategyNote: string;
};

/**
 * P2-5：按目标模式估算每日热量预算。
 * - cut：TDEE − 缺口（默认 400），不低于安全下限
 * - maintain：≈ TDEE
 * - bulk：TDEE + 盈余（默认 250）
 */
export function estimateCalorieGoal(input: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
  activityLevel: ActivityLevel;
  goalMode?: GoalMode | string | null;
  deficit?: number;
  surplus?: number;
}): CalorieGoalEstimate {
  const goalMode = parseGoalMode(input.goalMode);
  const bmr = estimateBmr(input);
  const tdee = estimateTdee(input);
  const floor = input.sex === "female" ? 1200 : 1500;

  if (goalMode === "maintain") {
    return {
      bmr,
      tdee,
      goalMode,
      deficit: 0,
      surplus: 0,
      dailyCalorieGoal: tdee,
      strategyNote: `维持模式：预算约等于维持消耗 ${tdee} kcal`,
    };
  }

  if (goalMode === "bulk") {
    const surplus = input.surplus ?? 250;
    const goal = tdee + surplus;
    return {
      bmr,
      tdee,
      goalMode,
      deficit: 0,
      surplus,
      dailyCalorieGoal: goal,
      strategyNote: `增肌模式：在维持 ${tdee} 上约 +${surplus} kcal 盈余`,
    };
  }

  const deficit = input.deficit ?? 400;
  const goal = Math.max(tdee - deficit, floor);
  const appliedDeficit = tdee - goal;
  return {
    bmr,
    tdee,
    goalMode: "cut",
    deficit: appliedDeficit,
    surplus: 0,
    dailyCalorieGoal: goal,
    strategyNote: `减脂模式：维持约 ${tdee} kcal，按约 ${appliedDeficit} kcal 缺口估算`,
  };
}

/** @deprecated 请用 estimateCalorieGoal；保留兼容旧调用 */
export const estimateFatLossCalorieGoal = (input: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
  activityLevel: ActivityLevel;
  deficit?: number;
}) => estimateCalorieGoal({ ...input, goalMode: "cut" });
