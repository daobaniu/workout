import { ProgramsClient } from "@/components/programs/programs-client";
import { loadProgramsPageData } from "@/lib/fitness/programs/programs-page-data";

export const dynamic = "force-dynamic";

export default async function ProgramsPage() {
  const data = await loadProgramsPageData();

  return (
    <ProgramsClient
      place={data.profile.place}
      daysPerWeek={data.profile.daysPerWeek}
      experienceLevel={data.profile.experienceLevel}
      initialData={{
        recommended: data.recommended,
        others: data.others,
        programs: data.programs,
        todayPlan: data.todayPlan
          ? {
              title: data.todayPlan.title,
              estimatedMin: data.todayPlan.estimatedMin,
              isRestDay: data.todayPlan.isRestDay,
              exercises: data.todayPlan.exercises,
            }
          : null,
      }}
    />
  );
}
