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
              goalMode: overview.profile.goalMode,
            }
          : null,
        nutrition: overview.nutrition,
        workouts: overview.workouts.map((w) => ({
          id: w.id,
          title: w.title,
          completed: w.completed,
          caloriesBurned: w.caloriesBurned,
          source: w.source,
        })),
        latestWeight: overview.latestWeight,
        weightTrend: overview.weightTrend,
        weightPoints: overview.weightPoints,
        activeProgram: overview.activeProgram,
        todayPlan: overview.todayPlan
          ? {
              title: overview.todayPlan.title,
              estimatedMin: overview.todayPlan.estimatedMin,
              isRestDay: overview.todayPlan.isRestDay,
              exercises: overview.todayPlan.exercises.map((e) => ({
                name: e.name,
                sets: e.sets,
                reps: e.reps,
              })),
            }
          : null,
        checkedIn: overview.checkedIn,
      }}
    />
  );
}
