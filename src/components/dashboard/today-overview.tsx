"use client";

export type TodayOverviewData = {
  profile: {
    dailyCalorieGoal: number;
    weightKg: number | null;
    targetWeightKg: number | null;
    trainingPlace: string;
  } | null;
  nutrition: {
    goal: number;
    eaten: { calories: number; proteinG: number };
    remainingCalories: number;
    foods: Array<{ description: string; calories: number }>;
  };
  workouts: Array<{ id: string; title: string; completed: boolean }>;
  latestWeight: number | null;
  weightTrend: string | null;
};

export function TodayOverview({
  data,
  loading,
  onRefresh,
}: {
  data: TodayOverviewData | null;
  loading?: boolean;
  onRefresh?: () => void;
}) {
  const goal = data?.nutrition.goal ?? data?.profile?.dailyCalorieGoal ?? 1800;
  const eaten = data?.nutrition.eaten.calories ?? 0;
  const remaining = data?.nutrition.remainingCalories ?? goal;
  const pct = Math.min(100, Math.round((eaten / Math.max(goal, 1)) * 100));
  const workoutDone = data?.workouts.some((w) => w.completed);
  const hasWorkout = (data?.workouts.length ?? 0) > 0;

  return (
    <aside className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-panel p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs tracking-[0.2em] text-muted-foreground">TODAY</p>
          <h2 className="font-(family-name:--font-display) text-2xl text-foreground">
            今日概览
          </h2>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-card"
        >
          {loading ? "刷新中…" : "刷新"}
        </button>
      </div>

      <div>
        <div className="mb-2 flex items-end justify-between">
          <div>
            <p className="text-sm text-muted-foreground">热量</p>
            <p className="text-3xl font-semibold tabular-nums text-foreground">
              {eaten}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / {goal}
              </span>
            </p>
          </div>
          <p className="text-sm text-primary">剩余 {remaining} kcal</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-card p-3">
          <p className="text-xs text-muted-foreground">蛋白粗估</p>
          <p className="text-lg font-semibold tabular-nums">
            {Math.round(data?.nutrition.eaten.proteinG ?? 0)} g
          </p>
        </div>
        <div className="rounded-xl bg-card p-3">
          <p className="text-xs text-muted-foreground">体重</p>
          <p className="text-lg font-semibold tabular-nums">
            {data?.latestWeight ?? "—"}
            <span className="text-sm font-normal text-muted-foreground"> kg</span>
          </p>
          {data?.weightTrend ? (
            <p className="mt-1 text-xs text-muted-foreground">{data.weightTrend}</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl bg-card p-3">
        <p className="text-xs text-muted-foreground">训练</p>
        {!hasWorkout ? (
          <p className="mt-1 text-sm text-foreground">
            今天还没安排课表，跟我说「推一套训练」
          </p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {data!.workouts.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-2">
                <span className="truncate">{w.title}</span>
                <span className={w.completed ? "text-primary" : "text-muted-foreground"}>
                  {w.completed ? "完成" : "待练"}
                </span>
              </li>
            ))}
          </ul>
        )}
        {hasWorkout && !workoutDone ? (
          <p className="mt-2 text-xs text-muted-foreground">练完可以说「训练完成了」</p>
        ) : null}
      </div>

      <div className="mt-auto rounded-xl border border-dashed border-border p-3 text-xs leading-relaxed text-muted-foreground">
        建议仅供参考，非医疗指导。饿了就吃够蛋白，累了就降配训练。
      </div>
    </aside>
  );
}
