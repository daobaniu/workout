import { startOfDay, endOfDay, subDays } from "date-fns";
import type { Profile as PrismaProfile } from "@prisma/client";
import {
  estimateCalorieGoal,
  type ActivityLevel,
  type Sex,
} from "@/lib/fitness/calories";
import { parseExperienceLevel } from "@/lib/fitness/experience";
import { parseGoalMode } from "@/lib/fitness/goal-mode";
import { estimateMacroGoals } from "@/lib/fitness/macros";
import { estimateDailyProteinGoal } from "@/lib/fitness/protein";
import { getProgramAwareTodaySlice } from "@/lib/fitness/programs/program-service";
import type { TodaySessionSummary } from "@/lib/fitness/programs/program-service";
import { prisma } from "./prisma";
import { workoutSessionRepository } from "./program-repository";

/** 与 schema 对齐；避免 IDE 缓存旧 Prisma Client 时报缺字段 */
export type Profile = PrismaProfile & {
  dailyProteinGoal: number | null;
  goalMode: string;
  experienceLevel: string;
  dietRestrictions: string | null;
  injuryNotes: string | null;
  equipmentPref: string | null;
};

type FoodLogRow = {
  id: string;
  description: string; // 食物描述
  calories: number; // 卡路里
  proteinG: number | null; // 蛋白质
  carbsG: number | null; // 碳水
  fatG: number | null; // 脂肪
  source: string;
  eatenAt: Date; // 食用时间
};

type WorkoutLogRow = {
  id: string;
  title: string; // 训练标题
  completed: boolean; // 是否完成
  templateId: string | null; // 模板ID
  exercisesJson: string; // 训练数据
};

/**
 * @description 获取用户配置
 * @returns - 用户配置
 */
export async function getProfile(): Promise<Profile | null> {
  return prisma.profile.findUnique({
    where: { id: "local" },
  }) as Promise<Profile | null>;
}

/**
 * @description 更新用户配置
 * @param data - 用户配置
 * @returns - 更新后的用户配置
 */
export async function upsertProfile(data: {
  heightCm?: number; // 身高
  weightKg?: number; // 体重
  targetWeightKg?: number; // 目标体重
  sex?: string; // 性别
  age?: number; // 年龄
  activityLevel?: string; // 活动水平( sedentary, light, moderate, active )
  dailyCalorieGoal?: number; // 每日热量目标
  dailyProteinGoal?: number; // 每日蛋白质目标 g
  goalMode?: string; // cut | maintain | bulk
  trainingPlace?: string; // 训练地点
  daysPerWeek?: number; // 每周训练天数
  experienceLevel?: string; // beginner | intermediate
  dietRestrictions?: string;
  injuryNotes?: string;
  equipmentPref?: string;
  notes?: string; // 备注
}): Promise<Profile> {
  const existing = await getProfile(); // 获取现有配置
  const heightCm = data.heightCm ?? existing?.heightCm ?? undefined; // 身高
  const weightKg = data.weightKg ?? existing?.weightKg ?? undefined; // 体重
  const sex = (data.sex ?? existing?.sex) as Sex | undefined; // 性别
  const age = data.age ?? existing?.age ?? undefined; // 年龄
  const activityLevel = (data.activityLevel ?? existing?.activityLevel) as
    | ActivityLevel
    | undefined; // 活动水平
  const experienceLevel = parseExperienceLevel(
    data.experienceLevel ?? existing?.experienceLevel,
  );
  const goalMode = parseGoalMode(data.goalMode ?? existing?.goalMode);

  let dailyCalorieGoal = data.dailyCalorieGoal; // 每日热量目标
  if (
    dailyCalorieGoal == null &&
    heightCm &&
    weightKg &&
    sex &&
    age &&
    activityLevel
  ) {
    dailyCalorieGoal = estimateCalorieGoal({
      sex,
      weightKg,
      heightCm,
      age,
      activityLevel,
      goalMode,
    }).dailyCalorieGoal;
  }

  let dailyProteinGoal = data.dailyProteinGoal;
  if (dailyProteinGoal == null && weightKg) {
    dailyProteinGoal = estimateDailyProteinGoal({
      weightKg,
      experienceLevel,
      goalMode,
    }).dailyProteinGoal;
  }

  const payload = { ...data, goalMode };

  return prisma.profile.upsert({
    where: { id: "local" },
    create: { id: "local", ...payload, dailyCalorieGoal, dailyProteinGoal },
    update: {
      ...payload,
      ...(dailyCalorieGoal != null ? { dailyCalorieGoal } : {}),
      ...(dailyProteinGoal != null ? { dailyProteinGoal } : {}),
    },
  }) as Promise<Profile>;
}

/**
 * @description 记录食物摄入
 * @param input 
 * @returns 
 */
export const logFood = async (input: {
  description: string;
  calories: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  source?: string;
}) => {
  return prisma.foodLog.create({
    data: {
      description: input.description,
      calories: input.calories,
      proteinG: input.proteinG,
      carbsG: input.carbsG,
      fatG: input.fatG,
      source: input.source ?? "chat",
    },
  });
};

/**
 * 修正已记录饮食的热量/宏量（P0-3）
 */
export async function updateFood(
  id: string,
  data: {
    description?: string;
    calories?: number;
    proteinG?: number | null;
    carbsG?: number | null;
    fatG?: number | null;
  },
) {
  const existing = await prisma.foodLog.findUnique({ where: { id } });
  if (!existing) throw new Error("饮食记录不存在");

  return prisma.foodLog.update({
    where: { id },
    data: {
      ...(data.description != null ? { description: data.description } : {}),
      ...(data.calories != null ? { calories: data.calories } : {}),
      ...(data.proteinG !== undefined ? { proteinG: data.proteinG } : {}),
      ...(data.carbsG !== undefined ? { carbsG: data.carbsG } : {}),
      ...(data.fatG !== undefined ? { fatG: data.fatG } : {}),
    },
  });
}

export async function deleteFood(id: string) {
  const existing = await prisma.foodLog.findUnique({ where: { id } });
  if (!existing) throw new Error("饮食记录不存在");
  return prisma.foodLog.delete({ where: { id } });
}

/**
 * @description 获取今日食物摄入
 * @param date - 日期
 * @returns - 今日食物摄入
 */
export async function getTodayFoodLogs(date = new Date()): Promise<FoodLogRow[]> {
  return prisma.foodLog.findMany({
    where: {
      eatenAt: {
        gte: startOfDay(date),
        lte: endOfDay(date),
      },
    },
    orderBy: { eatenAt: "asc" },
  });
}

/**
 * @description 获取今日营养摄入
 * @param date - 日期
 * @returns - 今日营养摄入
 */
export async function getTodayNutrition(date = new Date()) {
  const profile = await getProfile();
  const foods = await getTodayFoodLogs(date);
  const eaten = foods.reduce(
    (acc, f) => ({
      calories: acc.calories + f.calories,
      proteinG: acc.proteinG + (f.proteinG ?? 0),
      carbsG: acc.carbsG + (f.carbsG ?? 0),
      fatG: acc.fatG + (f.fatG ?? 0),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
  const goal = profile?.dailyCalorieGoal ?? 1800;
  const weightKg = profile?.weightKg ?? undefined;
  const goalMode = parseGoalMode(profile?.goalMode);
  const proteinGoal =
    profile?.dailyProteinGoal ??
    (weightKg
      ? estimateDailyProteinGoal({
          weightKg,
          experienceLevel: profile?.experienceLevel,
          goalMode,
        }).dailyProteinGoal
      : 120);
  const macros = estimateMacroGoals({
    calorieGoal: goal,
    proteinGoalG: proteinGoal,
    weightKg,
    goalMode,
  });
  const remainingProteinG = Math.max(proteinGoal - eaten.proteinG, 0);
  const remainingCarbsG = Math.max(macros.carbsGoalG - eaten.carbsG, 0);
  const remainingFatG = Math.max(macros.fatGoalG - eaten.fatG, 0);

  return {
    goal,
    goalMode,
    proteinGoal,
    carbsGoal: macros.carbsGoalG,
    fatGoal: macros.fatGoalG,
    eaten,
    remainingCalories: Math.max(goal - eaten.calories, 0),
    remainingProteinG,
    remainingCarbsG,
    remainingFatG,
    foods: foods.map((f) => ({
      id: f.id,
      description: f.description,
      calories: f.calories,
      proteinG: f.proteinG,
      carbsG: f.carbsG,
      fatG: f.fatG,
      source: f.source,
      eatenAt: f.eatenAt.toISOString(),
    })),
  };
}

/**
 * @description 记录体重
 * @param weightKg - 体重
 * @returns 
 */
export async function logWeight(weightKg: number) {
  const entry = await prisma.weightLog.create({
    data: { weightKg },
  });
  await prisma.profile.upsert({
    where: { id: "local" },
    create: { id: "local", weightKg },
    update: { weightKg },
  });
  return entry;
}

/**
 * @description 获取最近体重
 * @param days - 天数
 * @returns 
 */
export async function getRecentWeights(days = 14) {
  return prisma.weightLog.findMany({
    where: { date: { gte: subDays(new Date(), days) } },
    orderBy: { date: "asc" },
  });
}

/**
 * @description 保存训练
 * @param input - 训练数据
 * @returns 
 */
export async function saveWorkout(input: {
  templateId?: string;
  title: string;
  exercises: unknown;
  notes?: string;
  completed?: boolean;
}) {
  return prisma.workoutLog.create({
    data: {
      templateId: input.templateId,
      title: input.title,
      exercisesJson: JSON.stringify(input.exercises),
      notes: input.notes,
      completed: input.completed ?? false,
    },
  });
}

/**
 * @description 完成训练
 * @param id - 训练ID
 * @returns 
 */
export async function completeWorkout(id: string) {
  return prisma.workoutLog.update({
    where: { id },
    data: { completed: true },
  });
}

/**
 * 删除待练训练（旧版 WorkoutLog）
 */
export async function deleteWorkoutLog(id: string) {
  const row = await prisma.workoutLog.findUnique({ where: { id } });
  if (!row) throw new Error("训练记录不存在");
  if (row.completed) throw new Error("已完成的训练不能删除");
  return prisma.workoutLog.delete({ where: { id } });
}

/**
 * 删除待练训练会话（计划开练产生的 WorkoutSession）
 */
export async function deleteWorkoutSession(id: string) {
  const row = await workoutSessionRepository.getById(id);
  if (!row) throw new Error("训练会话不存在");
  if (row.completed) throw new Error("已完成的训练不能删除");
  return workoutSessionRepository.delete(id);
}

/**
 * 按来源删除今日待练
 */
export async function deletePendingWorkout(
  id: string,
  source: "session" | "legacy" = "session",
) {
  if (source === "legacy") {
    return deleteWorkoutLog(id);
  }
  return deleteWorkoutSession(id);
}

/**
 * @description 获取今日训练
 * @param date - 日期
 * @returns - 今日训练
 */
export async function getTodayWorkouts(date = new Date()): Promise<WorkoutLogRow[]> {
  return prisma.workoutLog.findMany({
    where: {
      date: {
        gte: startOfDay(date),
        lte: endOfDay(date),
      },
    },
    orderBy: { date: "desc" },
  });
}

/**
 * @description 获取今日概览
 * @returns 
 */
export async function getTodayOverview() {
  const [profile, nutrition, workouts, weights, programSlice] =
    await Promise.all([
      getProfile(),
      getTodayNutrition(),
      getTodayWorkouts(),
      getRecentWeights(14),
      getProgramAwareTodaySlice(),
    ]);

  let weightTrend: string | null = null;
  if (weights.length >= 2) {
    const first = weights[0].weightKg;
    const last = weights[weights.length - 1].weightKg;
    const delta = Number((last - first).toFixed(1));
    weightTrend =
      delta === 0
        ? "近两周体重持平"
        : delta < 0
          ? `近两周 ${delta}kg`
          : `近两周 +${delta}kg`;
  }

  const sessionWorkouts = programSlice.sessions.map((s: TodaySessionSummary) => ({
    id: s.id,
    title: s.title,
    completed: s.completed,
    templateId: null as string | null,
    exercises: s.exercises as unknown,
    caloriesBurned: s.caloriesBurned,
    source: "session" as const,
  }));

  const legacyWorkouts = workouts.map((w) => ({
    id: w.id,
    title: w.title,
    completed: w.completed,
    templateId: w.templateId,
    exercises: JSON.parse(w.exercisesJson) as unknown,
    caloriesBurned: null as number | null,
    source: "legacy" as const,
  }));

  return {
    profile,
    nutrition,
    workouts: [...sessionWorkouts, ...legacyWorkouts],
    latestWeight: weights.at(-1)?.weightKg ?? profile?.weightKg ?? null,
    weightTrend,
    weightPoints: weights.map((w) => ({
      date: w.date.toISOString().slice(0, 10),
      weightKg: w.weightKg,
    })),
    activeProgram: programSlice.activeProgram,
    todayPlan: programSlice.todayPlan,
    checkedIn: programSlice.checkedIn,
    checkIn: programSlice.checkIn,
  };
}
