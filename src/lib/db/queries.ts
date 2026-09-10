import { startOfDay, endOfDay, subDays } from "date-fns";
import {
  estimateFatLossCalorieGoal,
  type ActivityLevel,
  type Sex,
} from "@/lib/fitness/calories";
import { prisma } from "./prisma";

type FoodLogRow = {
  id: string;
  description: string;
  calories: number;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  eatenAt: Date;
};

type WorkoutLogRow = {
  id: string;
  title: string;
  completed: boolean;
  templateId: string | null;
  exercisesJson: string;
};

export async function getProfile() {
  return prisma.profile.findUnique({ where: { id: "local" } });
}

export async function upsertProfile(data: {
  heightCm?: number;
  weightKg?: number;
  targetWeightKg?: number;
  sex?: string;
  age?: number;
  activityLevel?: string;
  dailyCalorieGoal?: number;
  trainingPlace?: string;
  daysPerWeek?: number;
  notes?: string;
}) {
  const existing = await getProfile();
  const heightCm = data.heightCm ?? existing?.heightCm ?? undefined;
  const weightKg = data.weightKg ?? existing?.weightKg ?? undefined;
  const sex = (data.sex ?? existing?.sex) as Sex | undefined;
  const age = data.age ?? existing?.age ?? undefined;
  const activityLevel = (data.activityLevel ?? existing?.activityLevel) as
    | ActivityLevel
    | undefined;

  let dailyCalorieGoal = data.dailyCalorieGoal;
  if (
    dailyCalorieGoal == null &&
    heightCm &&
    weightKg &&
    sex &&
    age &&
    activityLevel
  ) {
    dailyCalorieGoal = estimateFatLossCalorieGoal({
      sex,
      weightKg,
      heightCm,
      age,
      activityLevel,
    }).dailyCalorieGoal;
  }

  return prisma.profile.upsert({
    where: { id: "local" },
    create: { id: "local", ...data, dailyCalorieGoal },
    update: { ...data, ...(dailyCalorieGoal != null ? { dailyCalorieGoal } : {}) },
  });
}

export async function logFood(input: {
  description: string;
  calories: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  source?: string;
}) {
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
}

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
  return {
    goal,
    eaten,
    remainingCalories: Math.max(goal - eaten.calories, 0),
    foods: foods.map((f) => ({
      id: f.id,
      description: f.description,
      calories: f.calories,
      proteinG: f.proteinG,
      carbsG: f.carbsG,
      fatG: f.fatG,
      eatenAt: f.eatenAt.toISOString(),
    })),
  };
}

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

export async function getRecentWeights(days = 14) {
  return prisma.weightLog.findMany({
    where: { date: { gte: subDays(new Date(), days) } },
    orderBy: { date: "asc" },
  });
}

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

export async function completeWorkout(id: string) {
  return prisma.workoutLog.update({
    where: { id },
    data: { completed: true },
  });
}

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

export async function getTodayOverview() {
  const [profile, nutrition, workouts, weights] = await Promise.all([
    getProfile(),
    getTodayNutrition(),
    getTodayWorkouts(),
    getRecentWeights(14),
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

  return {
    profile,
    nutrition,
    workouts: workouts.map((w) => ({
      id: w.id,
      title: w.title,
      completed: w.completed,
      templateId: w.templateId,
      exercises: JSON.parse(w.exercisesJson) as unknown,
    })),
    latestWeight: weights.at(-1)?.weightKg ?? profile?.weightKg ?? null,
    weightTrend,
  };
}
