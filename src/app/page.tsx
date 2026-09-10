import { HomeClient } from "@/components/home-client";
import { getTodayOverview } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const overview = await getTodayOverview();

  return (
    <HomeClient
      hasProfile={Boolean(overview.profile)}
      initialOverview={{
        profile: overview.profile
          ? {
              dailyCalorieGoal: overview.profile.dailyCalorieGoal,
              weightKg: overview.profile.weightKg,
              targetWeightKg: overview.profile.targetWeightKg,
              trainingPlace: overview.profile.trainingPlace,
            }
          : null,
        nutrition: overview.nutrition,
        workouts: overview.workouts.map((w) => ({
          id: w.id,
          title: w.title,
          completed: w.completed,
        })),
        latestWeight: overview.latestWeight,
        weightTrend: overview.weightTrend,
      }}
    />
  );
}
