export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

/** Mifflin-St Jeor 基础代谢 */
export function estimateBmr(input: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
}) {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
  return Math.round(input.sex === "male" ? base + 5 : base - 161);
}

/** 维持体重大约需要的每日热量 */
export function estimateTdee(input: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
  activityLevel: ActivityLevel;
}) {
  return Math.round(estimateBmr(input) * ACTIVITY_FACTOR[input.activityLevel]);
}

/**
 * 减脂每日热量预算：维持热量减去温和缺口。
 * 多数人不知道「预算」时，用这个自动估算即可。
 */
export function estimateFatLossCalorieGoal(input: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
  activityLevel: ActivityLevel;
  deficit?: number;
}) {
  const tdee = estimateTdee(input);
  const deficit = input.deficit ?? 400;
  const floor = input.sex === "female" ? 1200 : 1500;
  const goal = Math.max(tdee - deficit, floor);
  return {
    bmr: estimateBmr(input),
    tdee,
    deficit,
    dailyCalorieGoal: goal,
  };
}
