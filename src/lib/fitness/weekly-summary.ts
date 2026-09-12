import { endOfDay, format, startOfDay, subDays } from "date-fns";
import { getProfile, getRecentWeights, getTodayNutrition } from "@/lib/db/queries";
import {
  checkInRepository,
  workoutSessionRepository,
} from "@/lib/db/program-repository";
import { prisma } from "@/lib/db/prisma";

type FoodLogRow = Awaited<
  ReturnType<typeof prisma.foodLog.findMany>
>[number];
type WeightLogRow = Awaited<ReturnType<typeof getRecentWeights>>[number];
type WorkoutSessionRow = Awaited<
  ReturnType<typeof workoutSessionRepository.listByDateRange>
>[number];

export type WeeklySummary = {
  rangeLabel: string;
  foodLogDays: number;
  checkInDays: number;
  workoutSessions: number;
  completedWorkouts: number;
  avgCalories: number | null;
  avgProteinG: number | null;
  weightStart: number | null;
  weightEnd: number | null;
  weightDelta: number | null;
  calorieGoal: number;
  proteinGoal: number;
  tips: string[];
};

/**
 * 规则优先的近 7 天小结（不调模型）。
 */
export async function buildWeeklySummary(
  today = new Date(),
): Promise<WeeklySummary> {
  const from = startOfDay(subDays(today, 6));
  const to = endOfDay(today);
  const profile = await getProfile();
  const nutritionToday = await getTodayNutrition(today);

  const [foods, sessions, checkIns, weights] = await Promise.all([
    prisma.foodLog.findMany({
      where: { eatenAt: { gte: from, lte: to } },
      orderBy: { eatenAt: "asc" },
    }),
    workoutSessionRepository.listByDateRange(from, to),
    checkInRepository.listBetween(
      format(from, "yyyy-MM-dd"),
      format(to, "yyyy-MM-dd"),
    ),
    getRecentWeights(14),
  ]);

  const foodDays = new Set(
    foods.map((f: FoodLogRow) => format(f.eatenAt, "yyyy-MM-dd")),
  );
  const dayCalories = new Map<string, number>();
  const dayProtein = new Map<string, number>();
  for (const f of foods) {
    const key = format(f.eatenAt, "yyyy-MM-dd");
    dayCalories.set(key, (dayCalories.get(key) ?? 0) + f.calories);
    dayProtein.set(key, (dayProtein.get(key) ?? 0) + (f.proteinG ?? 0));
  }

  const calValues = [...dayCalories.values()];
  const proValues = [...dayProtein.values()];
  const avgCalories =
    calValues.length > 0
      ? Math.round(calValues.reduce((a, b) => a + b, 0) / calValues.length)
      : null;
  const avgProteinG =
    proValues.length > 0
      ? Math.round(proValues.reduce((a, b) => a + b, 0) / proValues.length)
      : null;

  const weightsInRange = weights.filter(
    (w: WeightLogRow) => w.date >= from && w.date <= to,
  );
  const weightStart = weightsInRange[0]?.weightKg ?? null;
  const weightEnd =
    weightsInRange.at(-1)?.weightKg ??
    weights.at(-1)?.weightKg ??
    profile?.weightKg ??
    null;
  const weightDelta =
    weightStart != null && weightEnd != null
      ? Number((weightEnd - weightStart).toFixed(1))
      : null;

  const calorieGoal = nutritionToday.goal;
  const proteinGoal = nutritionToday.proteinGoal;
  const tips: string[] = [];

  if (foodDays.size < 3) {
    tips.push("这周饮食记录偏少，先保证每天至少记一餐，趋势才有意义。");
  }
  if (
    checkIns.length < 2 &&
    sessions.filter((s: WorkoutSessionRow) => s.completed).length < 2
  ) {
    tips.push("训练/打卡次数不多，下周尽量按计划完成 2–3 次力量。");
  }
  if (
    weightDelta != null &&
    weightDelta >= 0 &&
    foodDays.size >= 3 &&
    avgCalories != null &&
    avgCalories > calorieGoal * 0.95
  ) {
    tips.push(
      "近一周体重未下降，且日均热量接近预算——检查周末加餐与蛋白是否达标。",
    );
  }
  if (
    avgProteinG != null &&
    avgProteinG < proteinGoal * 0.75 &&
    foodDays.size >= 2
  ) {
    tips.push(
      `日均蛋白约 ${avgProteinG}g，低于目标 ${proteinGoal}g，优先把蛋白凑够再砍主食。`,
    );
  }
  if (tips.length === 0) {
    tips.push("节奏不错。继续按热量与蛋白目标执行，周末也尽量记一笔。");
  }

  return {
    rangeLabel: `${format(from, "MM/dd")} – ${format(to, "MM/dd")}`,
    foodLogDays: foodDays.size,
    checkInDays: checkIns.length,
    workoutSessions: sessions.length,
    completedWorkouts: sessions.filter((s: WorkoutSessionRow) => s.completed)
      .length,
    avgCalories,
    avgProteinG,
    weightStart,
    weightEnd,
    weightDelta,
    calorieGoal,
    proteinGoal,
    tips,
  };
}
