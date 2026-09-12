import { getProfile, upsertProfile } from "@/lib/db/queries";
import {
  estimateCalorieGoal,
  type ActivityLevel,
  type Sex,
} from "@/lib/fitness/calories";
import { parseExperienceLevel } from "@/lib/fitness/experience";
import { parseGoalMode } from "@/lib/fitness/goal-mode";
import { estimateDailyProteinGoal } from "@/lib/fitness/protein";

export async function GET() {
  const profile = await getProfile();
  return Response.json({ profile });
}

export async function POST(req: Request) {
  const body = await req.json();

  const heightCm = body.heightCm ? Number(body.heightCm) : undefined;
  const weightKg = body.weightKg ? Number(body.weightKg) : undefined;
  const targetWeightKg = body.targetWeightKg
    ? Number(body.targetWeightKg)
    : undefined;
  const sex = body.sex as Sex | undefined;
  const age = body.age ? Number(body.age) : undefined;
  const activityLevel = body.activityLevel as ActivityLevel | undefined;
  const experienceLevel = body.experienceLevel
    ? parseExperienceLevel(body.experienceLevel)
    : undefined;
  const goalMode = body.goalMode ? parseGoalMode(body.goalMode) : undefined;

  let dailyCalorieGoal = body.dailyCalorieGoal
    ? Number(body.dailyCalorieGoal)
    : undefined;

  // 未手动指定时，按目标模式自动估算热量预算
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

  let dailyProteinGoal = body.dailyProteinGoal
    ? Number(body.dailyProteinGoal)
    : undefined;
  if (dailyProteinGoal == null && weightKg) {
    dailyProteinGoal = estimateDailyProteinGoal({
      weightKg,
      experienceLevel,
      goalMode,
    }).dailyProteinGoal;
  }

  const profile = await upsertProfile({
    heightCm,
    weightKg,
    targetWeightKg,
    sex,
    age,
    activityLevel,
    dailyCalorieGoal,
    dailyProteinGoal,
    goalMode,
    trainingPlace: body.trainingPlace,
    daysPerWeek: body.daysPerWeek ? Number(body.daysPerWeek) : undefined,
    experienceLevel,
    dietRestrictions:
      body.dietRestrictions !== undefined
        ? String(body.dietRestrictions)
        : undefined,
    injuryNotes:
      body.injuryNotes !== undefined ? String(body.injuryNotes) : undefined,
    equipmentPref:
      body.equipmentPref !== undefined
        ? String(body.equipmentPref)
        : undefined,
    notes: body.notes !== undefined ? String(body.notes) : undefined,
  });
  return Response.json({ profile });
}
