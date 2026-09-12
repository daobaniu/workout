import { getProfile, getTodayNutrition } from "@/lib/db/queries";
import {
  suggestDailyMeals,
  suggestProteinBoosts,
} from "@/lib/fitness/meals";
import { buildPreferenceNote } from "@/lib/fitness/preferences";

export async function GET() {
  const profile = await getProfile();
  const today = await getTodayNutrition();
  const preferenceNote = buildPreferenceNote(profile);

  const meals = suggestDailyMeals({
    remainingCalories: today.remainingCalories,
    remainingProteinG: today.remainingProteinG,
    proteinGoal: today.proteinGoal,
    preferenceNote: preferenceNote ?? undefined,
    dietRestrictions: profile?.dietRestrictions,
  });

  const proteinBoosts = suggestProteinBoosts({
    remainingCalories: today.remainingCalories,
    remainingProteinG: today.remainingProteinG,
    dietRestrictions: profile?.dietRestrictions,
    limit: 3,
  });

  return Response.json({
    ok: true,
    remainingCalories: today.remainingCalories,
    remainingProteinG: today.remainingProteinG,
    proteinGoal: today.proteinGoal,
    proteinEaten: today.eaten.proteinG,
    preferenceNote,
    meals,
    proteinBoosts,
  });
}
