import type { ActivityLevel, Sex } from "@/lib/fitness/calories";
import { parseExperienceLevel } from "@/lib/fitness/experience";
import { parseGoalMode } from "@/lib/fitness/goal-mode";
import { getProfile } from "@/lib/db/queries";
import { OnboardingForm, type OnboardingFormValues } from "@/components/onboarding-form";

export const dynamic = "force-dynamic";

const defaultForm: OnboardingFormValues = {
  heightCm: "170",
  weightKg: "70",
  targetWeightKg: "65",
  sex: "male",
  age: "28",
  activityLevel: "light",
  goalMode: "cut",
  dailyCalorieGoal: "",
  dailyProteinGoal: "",
  trainingPlace: "home",
  daysPerWeek: "3",
  experienceLevel: "beginner",
  dietRestrictions: "",
  injuryNotes: "",
  equipmentPref: "",
  notes: "",
};

function toFormValues(
  profile: NonNullable<Awaited<ReturnType<typeof getProfile>>>,
): OnboardingFormValues {
  const sex: Sex =
    profile.sex === "female" || profile.sex === "male" ? profile.sex : "male";
  const activityLevel: ActivityLevel =
    profile.activityLevel === "sedentary" ||
    profile.activityLevel === "light" ||
    profile.activityLevel === "moderate" ||
    profile.activityLevel === "active"
      ? profile.activityLevel
      : "light";

  return {
    heightCm: profile.heightCm != null ? String(profile.heightCm) : defaultForm.heightCm,
    weightKg: profile.weightKg != null ? String(profile.weightKg) : defaultForm.weightKg,
    targetWeightKg:
      profile.targetWeightKg != null
        ? String(profile.targetWeightKg)
        : defaultForm.targetWeightKg,
    sex,
    age: profile.age != null ? String(profile.age) : defaultForm.age,
    activityLevel,
    goalMode: parseGoalMode(profile.goalMode),
    dailyCalorieGoal:
      profile.dailyCalorieGoal != null ? String(profile.dailyCalorieGoal) : "",
    dailyProteinGoal:
      profile.dailyProteinGoal != null ? String(profile.dailyProteinGoal) : "",
    trainingPlace: profile.trainingPlace || defaultForm.trainingPlace,
    daysPerWeek:
      profile.daysPerWeek != null
        ? String(profile.daysPerWeek)
        : defaultForm.daysPerWeek,
    experienceLevel: parseExperienceLevel(profile.experienceLevel),
    dietRestrictions: profile.dietRestrictions ?? "",
    injuryNotes: profile.injuryNotes ?? "",
    equipmentPref: profile.equipmentPref ?? "",
    notes: profile.notes ?? "",
  };
}

export default async function MePage() {
  const profile = await getProfile();
  const initialForm = profile ? toFormValues(profile) : defaultForm;

  return (
    <OnboardingForm
      initialForm={initialForm}
      hasExistingProfile={Boolean(profile)}
    />
  );
}
