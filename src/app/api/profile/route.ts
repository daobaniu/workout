import { getProfile, upsertProfile } from "@/lib/db/queries";
import {
  estimateFatLossCalorieGoal,
  type ActivityLevel,
  type Sex,
} from "@/lib/fitness/calories";

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

  let dailyCalorieGoal = body.dailyCalorieGoal
    ? Number(body.dailyCalorieGoal)
    : undefined;

  // 未手动指定时，用身体数据自动估算减脂热量预算
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

  const profile = await upsertProfile({
    heightCm,
    weightKg,
    targetWeightKg,
    sex,
    age,
    activityLevel,
    dailyCalorieGoal,
    trainingPlace: body.trainingPlace,
    daysPerWeek: body.daysPerWeek ? Number(body.daysPerWeek) : undefined,
    notes: body.notes || undefined,
  });
  return Response.json({ profile });
}
